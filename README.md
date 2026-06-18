# gabarito_AI

Aplicativo de estudos para concursos públicos com inteligência artificial. Suba o edital, a IA organiza as disciplinas e tópicos — e você começa a estudar com flashcards e questões geradas automaticamente.

## Funcionalidades

- **Upload de edital** — envie o PDF ou TXT e a IA organiza disciplinas e tópicos automaticamente
- **Plano de estudos** — checklist de tópicos por disciplina com progresso visual
- **Flashcards com repetição espaçada** — sistema Leitner (5 caixas) com agendamento automático de revisão
- **Questões de múltipla escolha** — geradas por IA com gabarito comentado
- **Dashboard** — visão geral do progresso em cada concurso

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend / Backend | Next.js 16 (App Router) |
| Banco de dados | Supabase (PostgreSQL + Auth + RLS) |
| IA | Anthropic Claude (claude-sonnet-4-6) |
| Estilo | Tailwind CSS |
| Linguagem | TypeScript |

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Variáveis de ambiente

Crie `.env.local` na raiz:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
ANTHROPIC_API_KEY=sua_chave_anthropic
```

### 3. Banco de dados

Execute os arquivos SQL no editor do Supabase, nessa ordem:

```
supabase/schema.sql   →  cria as tabelas e políticas RLS
supabase/seed.sql     →  dados de exemplo (opcional)
```

### 4. Rodar localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura

```
app/
  api/              # Endpoints de geração com IA
  concurso/[id]/    # Página de detalhes do concurso
  login/            # Autenticação
components/         # Componentes React
lib/                # Clientes Supabase, Anthropic e lógica Leitner
supabase/           # Schema e seed SQL
types/              # Interfaces TypeScript
```

## Licença

MIT
