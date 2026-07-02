# gabarito_AI

**Console de estudos para concursos públicos, alimentado por inteligência artificial.**

🌐 **Live:** [gabarito-lyart.vercel.app](https://gabarito-lyart.vercel.app) · [Landing](https://gabarito-lyart.vercel.app/sobre)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcielioqueiroz%2Fgabarito_AI&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,GEMINI_API_KEY&envDescription=Chaves%20do%20Supabase%20e%20do%20Google%20Gemini&envLink=https%3A%2F%2Fgithub.com%2Fcielioqueiroz%2Fgabarito_AI%23instala%C3%A7%C3%A3o)

Suba o edital em PDF ou TXT — a IA extrai as disciplinas, organiza os tópicos e gera flashcards e questões comentadas. Estude com repetição espaçada (sistema Leitner), acompanhe seu progresso e revise o que precisa, no ritmo certo.

---

## Funcionalidades

| Feature | Descrição |
|---|---|
| **Upload de edital** | PDF ou TXT (até 5 MB) → IA extrai e organiza disciplinas + tópicos automaticamente |
| **Plano de estudos** | Checklist por disciplina com progresso visual e trigger que registra `estudado_em` para analytics |
| **Flashcards Leitner** | Sistema de 5 caixas com agendamento automático de revisão (1/2/4/7/15 dias) |
| **Questões com IA** | Múltipla escolha gerada por IA com gabarito e explicação comentada |
| **Resumos com IA** | Resumos em markdown a partir de texto, link ou vídeo do YouTube |
| **Podcast** | Narração neural pt-BR de cada resumo (Edge TTS) — player com velocidade e download |
| **Revisão do Dia** | Sessão diária com todos os cards vencidos, cruzando concursos |
| **Multi-concurso** | Gerencie quantos concursos quiser, cada um com plano, cards e questões próprios |
| **Dashboard** | Visão geral com contadores animados de tópicos estudados e cards dominados |
| **Estatísticas** | KPIs de acerto, gráfico dos últimos 7 dias e desempenho por disciplina |
| **Atalhos de teclado** | Espaço vira o card, 1/J = errei, 2/K = acertei, U = desfazer |
| **PWA-ready** | `manifest.json` para instalação em mobile/desktop |
| **Dark/Light** | Tema escuro por padrão, alternável com persistência em localStorage (sem FOUC) |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, RSC, async params, `proxy.ts`) |
| Banco de dados | Supabase — PostgreSQL + Auth + Row Level Security |
| IA | Google Gemini `gemini-flash-latest` (saída estruturada via JSON Schema, camada gratuita) |
| Estilo | Tailwind CSS v4 + shadcn/ui |
| Animações | Framer Motion |
| 3D | Three.js (tela de login, lazy-loaded) |
| Componentes UI | shadcn/ui (Button, Card, Badge, Input) |
| Linguagem | TypeScript (strict) |

---

## Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com)
- Chave de API do [Google AI Studio](https://aistudio.google.com/apikey) (gratuita)

---

## Instalação

### 1. Clonar e instalar

```bash
git clone https://github.com/cielioqueiroz/gabarito_AI.git
cd gabarito_AI
npm install
```

### 2. Variáveis de ambiente

Crie `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIza...
```

> As chaves do Supabase estão em **Project Settings → API**.
> A chave Gemini está em **aistudio.google.com → Get API key** (gratuita).

O `lib/env.ts` valida essas variáveis em runtime e falha rápido se algo estiver ausente.

### 3. Banco de dados

Execute no SQL Editor do Supabase, nesta ordem:

```
supabase/schema.sql   →  tabelas, RLS com WITH CHECK, índices, views (concurso_stats, disciplina_stats) e triggers
supabase/seed.sql     →  dados de exemplo — Banco do Brasil 2023 (opcional)
```

### 4. Autenticação social (opcional)

Para habilitar login com Google:

1. **Supabase Dashboard → Authentication → Providers → Google** → habilitar e configurar Client ID/Secret
2. **URL Configuration → Redirect URLs**: adicione `http://localhost:3000/**` e sua URL de produção com `/**`
3. Para o fluxo de reset de senha, adicione também `<origin>/redefinir-senha`

### 5. Rodar localmente

```bash
npm run dev        # Next dev server
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run build      # build de produção
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Estrutura do projeto

```
gabarito_AI/
├── app/
│   ├── api/
│   │   ├── criar-com-edital/   # Upload + extração + geração do plano via IA (com rollback)
│   │   ├── gerar-flashcards/   # Geração de cards por disciplina
│   │   ├── gerar-questoes/     # Geração de questões com alternativas
│   │   ├── gerar-plano/        # Reimportação de edital
│   │   └── stream-plano/       # Versão streaming (messages.stream) para feedback incremental
│   ├── concurso/[id]/          # Detalhes do concurso (plano, flashcards, questões)
│   ├── revisao/                # Sessão de Revisão do Dia (Leitner cross-concurso)
│   ├── estatisticas/           # KPIs + gráfico 7 dias + desempenho por disciplina
│   ├── configuracoes/          # Perfil do usuário
│   ├── redefinir-senha/        # Fluxo de reset de senha
│   └── login/                  # Login/signup/forgot com Google OAuth e Three.js
├── components/
│   ├── ui/                     # shadcn/ui — Button, Card, Badge, Input
│   ├── Sidebar.tsx             # Navegação lateral com Framer Motion
│   ├── ShellLayout.tsx         # Shell: sidebar + header + footer + drawer mobile
│   ├── ThreeBackground.tsx     # Canvas Three.js (dynamic import, ssr: false)
│   ├── HomeClient.tsx          # Dashboard com stats animados
│   ├── ConcursoCard.tsx        # Card com hover animado
│   ├── ConcursoDetail.tsx      # Página de concurso com tabs animadas
│   ├── PlanoTab.tsx            # Plano de estudos com accordion Framer Motion
│   ├── FlashcardTab.tsx        # Lista de decks
│   ├── FlashcardStudy.tsx      # Componente reutilizável de estudo (atalhos, undo, previsão)
│   ├── QuestaoTab.tsx          # Questões com alternativas interativas
│   ├── RevisaoClient.tsx       # Sessão de revisão diária (usa FlashcardStudy)
│   ├── EstatisticasClient.tsx  # Página de estatísticas
│   └── ProgressBar.tsx         # Barra animada (Framer Motion)
├── lib/
│   ├── anthropic.ts            # Cliente Gemini (nome legado) — callClaudeStructured + retry
│   ├── apiHelpers.ts           # requireAuth, checkRateLimit, ownership checks
│   ├── concursos.ts            # getConcursosComStats via view concurso_stats
│   ├── env.ts                  # Validação de env vars
│   ├── i18n.ts                 # Catálogo de strings
│   ├── leitner.ts              # Lógica Leitner — boxes 1-5, intervalos, isDue()
│   ├── logger.ts               # Logger JSON estruturado
│   ├── rateLimit.ts            # Rate limiter (in-memory)
│   ├── theme.tsx               # ThemeContext — dark/light com localStorage
│   ├── toast.tsx               # Toast provider
│   ├── utils.ts                # cn() helper (clsx + tailwind-merge)
│   └── supabase/               # Clientes server e client do Supabase
├── supabase/
│   ├── schema.sql              # DDL completo com RLS (WITH CHECK), índices, views e triggers
│   └── seed.sql                # Seed — BB Agente de Tecnologia 2023
├── proxy.ts                    # Autenticação + redirect (convenção Next 16, substitui middleware.ts)
├── next.config.ts              # Headers de segurança + serverExternalPackages
└── types/                      # Interfaces TypeScript
```

---

## Rotas de API

| Endpoint | Método | Rate limit | Descrição |
|---|---|---|---|
| `/api/criar-com-edital` | `POST` (multipart) | 5/min | Cria concurso + processa edital + gera plano |
| `/api/gerar-plano` | `POST` (JSON) | 5/min | Gera/reimporta plano a partir de texto |
| `/api/gerar-flashcards` | `POST` (JSON) | 10/min | Gera flashcards para uma disciplina |
| `/api/gerar-questoes` | `POST` (JSON) | 10/min | Gera questões de múltipla escolha |
| `/api/stream-plano` | `POST` (JSON) | 5/min | Versão streaming (`text/plain` chunk-a-chunk) |
| `/api/gerar-resumo` | `POST` (JSON) | 10/min | Gera resumo em markdown de texto, link ou YouTube |
| `/api/podcast/[resumoId]` | `GET` | 20/min | MP3 do resumo em voz neural pt-BR (Edge TTS) |

Todas as rotas exigem sessão autenticada, checam ownership da disciplina/concurso antes de chamar a IA, e usam **saída estruturada** com JSON Schema (não regex em markdown).

---

## Sistema Leitner

Os flashcards seguem o método de repetição espaçada com 5 caixas:

| Caixa | Status | Intervalo |
|---|---|---|
| 1 | Aprendendo | 1 dia |
| 2 | Revisando | 2 dias |
| 3 | Fixando | 4 dias |
| 4 | Dominando | 7 dias |
| 5 | Dominado | 15 dias |

Cards errados voltam para a caixa 1. Cards da caixa 4+ são considerados **dominados** no cálculo de progresso.

### Atalhos do estudo

| Tecla | Ação |
|---|---|
| `Espaço` / `Enter` | Virar o card |
| `1` ou `J` | Errei (volta para caixa 1) |
| `2` ou `K` | Acertei (avança de caixa) |
| `U` | Desfazer última resposta |

---

## Segurança

- **Row Level Security** ativa em todas as tabelas com policies `USING` + `WITH CHECK` para bloquear leitura *e* escrita cruzada.
- **Ownership check** explícito em todas as rotas de IA — evita chamadas de IA com IDs de outros usuários.
- **Rate limiting** por `user_id` em cada rota de IA.
- **Limite de 5 MB** no upload de edital.
- **Env vars** validadas em runtime (`lib/env.ts`).
- **Security headers** globais (`next.config.ts`): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- **Retry com backoff exponencial** nas chamadas de IA (`lib/anthropic.ts`).

---

## Deploy

O projeto é compatível com **Vercel** out of the box.

1. Importe o repositório no [vercel.com](https://vercel.com)
2. Configure as variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`)
3. Deploy automático a cada push na `main`

Para produção com múltiplas instâncias, troque o `lib/rateLimit.ts` (in-memory) por `@upstash/ratelimit` ou equivalente.

---

## Licença

MIT — use, modifique e distribua livremente.
