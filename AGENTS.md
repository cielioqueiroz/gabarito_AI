<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# gabarito_AI — guia do agente

Console de estudos para concursos públicos. O usuário sobe um **edital ou prova** em PDF/imagem/TXT e a IA monta o plano de estudos, transcreve as questões reais da prova, gera flashcards (Leitner), questões, resumos e podcast.

Next.js 16 (App Router, RSC) · Supabase (Postgres + Auth + RLS) · Google Gemini · Tailwind v4 + shadcn/ui · TypeScript strict · deploy na Vercel.

O `README.md` explica **o produto e as decisões** (com diagramas e números medidos). Este arquivo diz **como mexer no código sem quebrar nada**. Leia o README antes de mudar a pipeline de ingestão.

---

## Entrada e estado operacional

Não existe um único `main.ts`: o App Router monta o sistema a partir destes pontos:

- `app/layout.tsx`: raiz global, metadata, fontes, providers e tema sem FOUC.
- `app/(app)/(dashboard)/page.tsx`: página `/` autenticada.
- `app/(app)/layout.tsx`: casco persistente da área logada.
- `proxy.ts`: renovação e gate inicial da sessão; cada página protegida ainda chama `requireSession()`.

**Supabase conectado pelo plugin/MCP do Codex:**

- Projeto: `gabarito-app`
- Project ref: `trqvrqlstpnqbtrjhnhh`
- Dashboard: `https://supabase.com/dashboard/project/trqvrqlstpnqbtrjhnhh`
- Região: `sa-east-1`
- O MCP já fornece acesso direto a SQL, migrations, tabelas, logs e advisors. Use a conexão existente; não crie `.mcp.json` ou OAuth duplicado.
- Para banco: inspecione primeiro, valide DDL com `execute_sql` dentro de `begin; ... rollback;`, aplique a versão final com `apply_migration` e rode advisors de segurança e performance depois.

**Estado de referência após o hardening de 31/08/2026:**

- `supabase/migrations/` espelha as oito migrations registradas no remoto, terminando em `20260831150918_fix_rate_limit_scope_config.sql`.
- O rate limit compartilhado está ativo em `api_rate_limits`; `lib/rateLimit.ts` é fallback para indisponibilidade do RPC.
- `check_rate_limit(text)` é `SECURITY DEFINER` intencional: a tabela não aceita acesso direto, `anon`/`public` não executam, `auth.uid()` identifica o dono e o cliente escolhe apenas um escopo fechado. Limites e janela ficam no `case` da função. Escopo novo exige atualizar a função em `schema.sql`, criar migration e manter o máximo passado a `checkRateLimit` para o fallback em memória.
- O advisor 0029 sinaliza esse RPC por ele ser executável por `authenticated`; neste caso o aviso é conhecido e intencional. Preserve as restrições acima.
- A proteção do Supabase Auth contra senhas vazadas ainda precisa ser habilitada no dashboard; não há setter dessa configuração no MCP atual.
- Advisors de performance podem marcar índices como “unused” enquanto não houver tráfego suficiente. Preserve índices de FK e filtros; ausência de uso inicial não autoriza removê-los.
- `lib/geracao.ts` é a fronteira de validação das saídas da IA. Toda saída estruturada passa por esses validadores antes do insert.
- `lib/ssrf.ts` centraliza validação de URL, DNS e bloqueio de redes privadas. Todo redirect é revalidado.
- Regenerar plano faz merge e preserva progresso, questões, flashcards e resumos existentes.
- Atualizações otimistas de flashcards, tópicos e questões fazem rollback quando a persistência falha.

---

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Dev server em `http://localhost:3000` |
| `npm run build` | Build de produção |
| `npm run typecheck` | `tsc --noEmit` — **precisa sair limpo** |
| `npm run lint` | ESLint flat config (`next lint` **não existe** no Next 16) |
| `npm test` | Testes de loteamento, `limparEnunciado`, validação da IA e SSRF |
| `npm run avaliar -- <arquivo.pdf> [--questoes]` | Roda os prompts reais contra um documento de verdade, sem servidor nem banco |

**Rodar um teste isolado** (não há runner; são scripts Node autônomos):

```bash
node scripts/testar-lotes.mjs                                  # loteamento de disciplinas
node --experimental-strip-types scripts/testar-enunciado.mjs   # limpeza de enunciado
node --experimental-strip-types scripts/testar-geracao.mjs     # saída não confiável da IA
node --experimental-strip-types scripts/testar-ssrf.mjs        # endereços públicos e privados
```

`--experimental-strip-types` é obrigatório em quem importa `.ts`. Por isso `lib/extracao.ts` **não pode ter dependências** — precisa rodar sob o strip-types do Node.

**Env obrigatórias** em `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`. Validadas em runtime por `lib/env.ts` (falha rápido). Não existe service-role key no ambiente — e não deve passar a existir.

---

## Next 16 — o que difere do que você "sabe"

| Assunto | Regra aqui |
|---|---|
| Middleware | Não existe `middleware.ts`. O gate de auth é `proxy.ts` na raiz, exportando `proxy()` + `config.matcher`. |
| Lint | `next lint` foi removido. `eslint.config.mjs` é flat config e importa `eslint-config-next/core-web-vitals` direto, sem `FlatCompat`. |
| `params` / `searchParams` | São **Promise**. Sempre `params: Promise<{ id: string }>` e `const { id } = await params`. |
| `layout` vs `template` | Layout **não** remonta entre navegações (Partial Rendering). Animação de entrada e qualquer coisa que precise rodar a cada rota vai em `template.tsx`. |
| Gate de sessão | Não fica no layout, justamente por isso — fica em `requireSession()`, chamado por **cada** `page.tsx`. |
| Pacotes Node em rota | `msedge-tts` e `youtube-transcript` estão em `serverExternalPackages` no `next.config.ts`. Biblioteca nativa nova precisa entrar nessa lista. |

Antes de escrever qualquer código de framework, consulte `node_modules/next/dist/docs/`.

---

## Mapa do código

```
app/
  layout.tsx              raiz: fontes, metadata, providers, script anti-FOUC de tema
  (publico)/              login · redefinir-senha · sobre (landing)
  (app)/
    layout.tsx            → <AppShell> (sidebar, drawer, rodapé) — persiste entre rotas
    template.tsx          animação de entrada — remonta a cada navegação
    (dashboard)/          home + loading.tsx do dashboard
    concurso/[id]/ concursos/ configuracoes/ estatisticas/ revisao/
  api/                    rotas REST (ver "Receita de uma rota")
  auth/callback/          troca de código PKCE (OAuth + e-mail)

lib/
  anthropic.ts    Cliente Gemini (nome legado, mantido por estabilidade de import).
                  callClaudeStructured, streamGeminiText, cadeia de modelos, wrappers de conteúdo.
  extracao.ts     Prompts + JSON Schemas da ingestão + limparEnunciado. SEM dependências.
  documentos.ts   Validação por assinatura de bytes e escolha texto-vs-OCR-nativo.
  apiHelpers.ts   requireAuth, checkRateLimit, assert*Ownership.
  auth.ts         requireSession() (com cache()) para páginas RSC.
  env.ts logger.ts rateLimit.ts leitner.ts concursos.ts i18n.ts utils.ts
  supabase/       server.ts (cookies) · client.ts (browser)
  theme.tsx toast.tsx motion.tsx shortcuts.tsx   providers client-side

components/       AppShell.tsx (casco) · Page.tsx (header + coluna) · ui/ (shadcn)
supabase/         schema.sql · migrations/ · seed.sql
scripts/          testes e avaliação da extração
types/index.ts    tipos de domínio compartilhados
```

---

## A regra de camadas

**Rota cuida de HTTP, auth e persistência. A inteligência mora em `lib/`.**

- Prompt, system message ou JSON Schema de ingestão **nunca** vai dentro de `app/api/*/route.ts` — vai em `lib/extracao.ts`. É a parte que mais muda e a única testável contra documentos reais sem servidor nem banco.
- Leitura e validação de arquivo ficam em `lib/documentos.ts`, não na rota.
- Chamada ao modelo passa por `callClaudeStructured` / `streamGeminiText`. Não faça `fetch` direto para a API do Gemini em rota nova — perderia a cadeia de fallback de modelos e o tratamento de truncamento.

Schemas *pequenos e locais* das rotas de geração (flashcards, questões, resumo) podem ficar no próprio `route.ts` — é o padrão atual e está ok. A regra vale para a **ingestão de documentos**, que é o caminho crítico.

---

## Segurança — regras não negociáveis

1. **RLS em 100% das tabelas**, com `USING` **e** `WITH CHECK`. Tabela nova sem policy é bug de segurança, não pendência.
2. **Só anon key + sessão do usuário.** Nenhum caminho pode contornar as policies. Não introduza service-role key.
3. **Toda rota `/api` começa por `requireAuth()`**, antes de qualquer parse de corpo.
4. **Ownership explícito** quando o id vem do cliente. O RLS impede acessar dados de *outro usuário*; não impede apontar para a disciplina de *outro concurso do próprio usuário*. Use `assertConcursoOwnership` / `assertDisciplinaOwnership`, ou filtre por `concurso_id` na query (ver `importar-questoes`).
5. **Rate limit antes de gastar token.** `checkRateLimit(auth.supabase, auth.userId, escopo, max)` vem logo depois do auth. O RPC recebe só o escopo; `max` alimenta o fallback em memória.
6. **A saída do modelo é entrada não confiável.** Antes de gravar: valide letra da alternativa, faixa de `numero`, valores de `CHECK` do banco e aplique `.slice()` em todo campo de texto. O que não passa é **descartado, não corrigido**.
7. **Arquivo é validado por assinatura de bytes**, nunca por extensão ou `Content-Type` — os dois vêm de quem envia. Ver `detectarMime` em `lib/documentos.ts`. Teto de 4 MB (`MAX_FILE_BYTES`).
8. **Documento do usuário é DADO, nunca instrução.** Todo prompt de ingestão inclui `AVISO_CONTEUDO_NAO_CONFIAVEL`. No modo texto, envolva com `wrapDocumento` / `wrapEdital` / `wrapProva`; no modo nativo o arquivo já vai como parte separada da mensagem. Vale também para instrução impressa dentro do PDF — a leitura nativa enxerga.
9. **Guard SSRF em toda ingestão de URL**: só http(s), IP-literal recusado, hosts internos bloqueados, redirects seguidos manualmente e **re-validados salto a salto**, corpo lido em stream com teto. A primitiva fica em `lib/ssrf.ts`; o fluxo de download está em `gerar-resumo/route.ts`.
10. **`questoes.correta` e `questoes.explicacao` nunca saem no payload da página.** O `select` da página de concurso lista as colunas explicitamente. A resposta só é revelada por `/api/responder`, depois que o usuário escolhe.
11. **Chave da IA vai no header `x-goog-api-key`**, nunca em query string (vazaria em log de proxy).
12. Security headers (CSP, HSTS, COOP/CORP…) ficam em `next.config.ts`. Adicionar origem externa exige mexer na CSP **e** justificar.

---

## Receita de uma rota `/api`

Ordem obrigatória. Copie de `app/api/gerar-flashcards/route.ts`.

```ts
export const runtime = 'nodejs'
export const maxDuration = 60          // 300 só para ingestão de documento (exige Fluid Compute)

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth              // 1. sessão
  const rl = await checkRateLimit(auth.supabase, auth.userId, 'escopo', 10)
  if (rl) return rl                                          // 2. rate limit

  const { disciplinaId } = await req.json()                  // 3. parse + validação de forma
  if (!disciplinaId) return NextResponse.json({ error: '…' }, { status: 400 })

  if (!(await assertDisciplinaOwnership(auth.supabase, auth.userId, disciplinaId)))
    return NextResponse.json({ error: 'Disciplina não encontrada' }, { status: 404 })  // 4. ownership

  try { /* 5. IA */ } catch (err) {
    logger.error('escopo', 'gemini', { err: String(err) })
    return NextResponse.json({ error: '…' }, { status: 502 })
  }
  // 6. validar a saída do modelo · 7. persistir com auth.supabase
}
```

Convenções:

- **Erros em português**, com `error` (frase curta) e, quando ajudar, `hint` (o que o usuário faz a respeito) e `detail` (causa técnica). Ver `criar-com-edital`: ele diferencia chave ausente de cota estourada.
- **Status**: 400 entrada inválida · 401 sem sessão · 404 não é seu / não existe · 413 upload grande demais · 422 documento não serve (não é edital nem prova) · 429 rate limit · 502 falha da IA · 500 falha ao gravar.
- **Log estruturado** com `logger.info/warn/error(escopo, evento, meta)`. Nunca logue conteúdo do usuário nem chave; trunque mensagens de erro com `.slice()`.
- **Rollback ao falhar no meio**: se o registro pai ficar inútil sem o filho, apague. `criar-com-edital` deleta o concurso quando o plano não salva.
- **Reimportação não pode duplicar nem apagar progresso.** Questões já existentes são puladas por `(disciplina_id, numero)`, e há índice único parcial no banco garantindo isso.

Limites atuais de rate limit (por usuário/minuto): ingestão de edital e plano `5`, geração `10`, importar questões `30`, podcast `20`, responder `120`. O estado compartilhado fica em `api_rate_limits`, atualizado atomicamente por `check_rate_limit`; `lib/rateLimit.ts` é fallback quando o RPC estiver indisponível.

---

## Receita de uma página da área logada

```ts
// app/(app)/algo/page.tsx — Server Component
export default async function AlgoPage() {
  const { supabase, user } = await requireSession()   // redireciona para /login se não houver sessão
  const dados = await ...                             // consultas server-side, RLS aplicado
  return <AlgoClient dados={dados} />                 // 'use client' só na folha
}
```

- **`requireSession()` em toda página da área logada**, sempre. Não confie no layout nem só no `proxy.ts`.
- Consultas independentes vão em `Promise.all` (ver `app/(app)/concurso/[id]/page.tsx`).
- O componente client recebe dados por prop; ele **não** refaz o fetch inicial.
- Mutação no cliente: `createClient()` do browser (Supabase direto, protegido por RLS) ou `fetch('/api/…')` quando envolve IA ou segredo — e depois **`router.refresh()`** para o RSC recarregar. Não mantenha cópia local do estado do servidor.
- Chrome da página: envolva o conteúdo em `<Page title=… headerRight=…>`. **Não** repita `max-w-* mx-auto px-6` na página — a coluna vem do `AppShell` via `useShell()`, para header, conteúdo e rodapé ficarem alinhados. Largura por rota fica em `LARGURA_POR_ROTA` (`components/AppShell.tsx`).
- `loading.tsx` vai no grupo de rota mais específico possível. Um skeleton de dashboard em `(app)/` apareceria também em `/configuracoes`.

---

## Camada de IA (`lib/anthropic.ts`)

- **Sempre saída estruturada** (`responseSchema`), nunca regex sobre markdown.
- **Nunca fixe um modelo.** `GEMINI_MODELS` é percorrida do preferido ao último recurso, e a cadeia inteira é repetida uma vez com espera. Os apelidos `-latest` saturam primeiro (503) — a lista é a defesa. Erro 4xx (exceto 429) não é repetido: `GeminiClientError` aborta na hora.
- **`MAX_EDITAL_CHARS = 300_000`.** Esse número já foi 12k e cortava o edital antes do anexo de conteúdo programático — justamente a parte que interessa. Não reduza sem medir.
- **`maxTokens` com folga.** Só limita, não reserva. Resposta cortada no teto devolve JSON pela metade e perde o lote inteiro; `callClaudeStructured` detecta `finishReason: 'MAX_TOKENS'` e lança erro legível.
- **`temperature`**: 0.1–0.2 para transcrição/extração, 0.4 para geração.
- **`maxDuration = 300`** nas rotas de ingestão (exige Fluid Compute). A latência do Gemini para o mesmo documento variou de 22 s a 82 s conforme a carga do Google — 60 s não é seguro.
- Ingestão é **em duas fases**: a fase 1 (`criar-com-edital`) grava a estrutura; a fase 2 (`importar-questoes`) transcreve em lotes independentes. Um lote que falhe não derruba o plano. Não junte as duas.
- **Lote é medido em questões (~10), não em disciplinas** — quem enche a resposta é o volume transcrito, e uma disciplina pode ter 6 ou 20 questões.

---

## Banco de dados

- `supabase/schema.sql` é o DDL completo e **espelha** as migrations; `supabase/migrations/` guarda as alterações incrementais. Ao mudar o esquema, atualize **os dois**.
- **Tudo idempotente**: `create table if not exists`, `add column if not exists`, `create index if not exists`, `drop policy if exists` antes do `create policy`, e bloco `do $$ … exception when duplicate_object then null; end $$` para constraints. Rodar duas vezes não pode quebrar.
- Views usam `with (security_invoker = true)` — sem isso a view roda com os privilégios do dono e fura o RLS.
- Funções de trigger: `security definer` + `set search_path = ''` **e** `revoke execute … from anon, authenticated, public`. Sem o revoke, o PostgREST expõe a função em `/rest/v1/rpc/` (advisors 0028/0029 do Supabase).
- O RPC `check_rate_limit(text)` é a exceção deliberada: precisa de `security definer` para gravar na tabela fechada e concede `execute` apenas a `authenticated`. Entradas aceitas são escopos enumerados internamente; valores desconhecidos falham fechados.
- Índice para toda FK e para toda coluna usada em filtro (`prox_revisao`, `origem`, `respondido_em`).
- Colunas com `check` (`dificuldade`, `origem`, `fonte`) exigem normalização no código **antes** do insert — valor inventado pelo modelo quebraria a query inteira.
- Tipos de domínio ficam em `types/index.ts` e precisam acompanhar o esquema.

---

## UI e design

Identidade **"Meia-noite & Azul-caneta"**. Tokens em `app/globals.css`: tema claro em `:root`, escuro em `html.dark`.

- Use os tokens semânticos (`bg-background`, `bg-surface`, `bg-elevated`, `text-foreground`, `text-muted`, `text-muted-foreground`, `border-border`). Hex cru só para o azul da marca.
- **Contraste WCAG AA é requisito.** O azul `#4A72E8` rende só 4.32:1 com texto branco: sólido com texto branco usa `#4064D8` (5.21:1) e reserva `#4A72E8` para o hover; azul **como texto** usa `#A8BCF8` (10.1:1 no escuro). Está documentado em `components/ui/button.tsx` — respeite.
- Classes sempre via `cn()` (`lib/utils.ts`). Variantes de componente com `cva`.
- Ícones: `lucide-react`. Componentes novos de UI: shadcn/ui em `components/ui/` (config em `components.json`, alias `@/`).
- **Motion respeita `prefers-reduced-motion`**: use `useMotion()` para escolher a variante, e `@media (prefers-reduced-motion: reduce)` nas animações CSS.
- **Tema sem FOUC**: a classe `dark` é aplicada por um script inline em `app/layout.tsx` antes da pintura. O `ThemeProvider` só **lê** o que o script decidiu — não reintroduza `useEffect` relendo `localStorage`.
- Acessibilidade já implementada e que não pode regredir: skip link, foco preso no drawer mobile, `Esc` devolvendo o foco ao botão que abriu, `aria-label` / `aria-expanded` nos controles.
- Texto de UI reutilizável vai em `lib/i18n.ts`. Feedback ao usuário via `useToast()`, nunca `alert()`.
- Confirmação de ação destrutiva usa `components/ui/ConfirmDialog.tsx`.

---

## Constantes duplicadas — manter em sincronia

Não há import compartilhado nestes casos (fronteira client/rota, ou script que precisa rodar sem dependências). Mudou um, mude os outros:

| Constante | Onde vive |
|---|---|
| `montarLotes`, `QUESTOES_POR_LOTE`, `PESO_PADRAO` | `components/NovoConcursoForm.tsx` ↔ `scripts/testar-lotes.mjs` |
| `MAX_DISCIPLINAS_POR_LOTE = 4` | `components/NovoConcursoForm.tsx` ↔ `app/api/importar-questoes/route.ts` ↔ `scripts/testar-lotes.mjs` |
| `MIN_CHARS_POR_PAGINA = 200` | `lib/documentos.ts` ↔ `scripts/avaliar-extracao.mjs` |
| lista de modelos Gemini | `lib/anthropic.ts` ↔ `scripts/avaliar-extracao.mjs` |

---

## Estilo de código

- **Sem ponto e vírgula**, aspas simples, 2 espaços. TypeScript strict — sem `any`, sem `@ts-ignore`.
- **Domínio em português** (`concursos`, `disciplinas`, `topicos`, `lerDocumento`, `montarLotes`); infraestrutura pode ficar em inglês, como já está. Siga o idioma do arquivo vizinho.
- **Comentário explica o *porquê*, não o *o quê*** — de preferência com o número medido que justificou a decisão. É o padrão do repositório inteiro; mantenha. Não adicione comentário que só narra a linha seguinte.
- Import absoluto com `@/` (mapeado para a raiz no `tsconfig.json`).
- Não crie arquivo de documentação novo por conta própria. `docs/` guarda planos e specs, `README.md` é o produto, este arquivo são as regras.

**Commits**: Conventional Commits em português, minúsculas, escopo entre parênteses, assunto descrevendo o efeito para o usuário — `fix(questoes): alternativas apareciam duas vezes na questao importada`, `feat(ingestao): le provas e editais inteiros, inclusive escaneados`. Escopos em uso: `ui`, `db`, `ingestao`, `upload`, `questoes`, `seo`, `a11y`, `readme`, `app`.

---

## Antes de dizer que terminou

```bash
npm run typecheck   # precisa sair limpo
npm test            # precisa passar
npm run lint        # precisa sair limpo
```

Mexeu na pipeline de ingestão? Rode também contra um documento real:

```bash
npm run avaliar -- caminho/para/prova.pdf --questoes
```

**Baseline atual:** typecheck, testes, lint e build limpos. Os scripts Node com `--experimental-strip-types` emitem apenas o aviso `MODULE_TYPELESS_PACKAGE_JSON`; ele não representa falha de teste e não justifica mudar o tipo de módulo do projeto sem avaliar o impacto no Next.js.
