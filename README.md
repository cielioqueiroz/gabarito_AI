# gabarito_AI

**Console de estudos para concursos públicos, alimentado por inteligência artificial.**

Suba o edital em PDF ou TXT — a IA extrai as disciplinas, organiza os tópicos e gera flashcards e questões comentadas. Estude com repetição espaçada (sistema Leitner), acompanhe seu progresso e revise o que precisa, no ritmo certo.

---

## Funcionalidades

| Feature | Descrição |
|---|---|
| **Upload de edital** | PDF ou TXT → IA extrai e organiza disciplinas + tópicos automaticamente |
| **Plano de estudos** | Checklist por disciplina com progresso visual e indicador de conclusão |
| **Flashcards Leitner** | Sistema de 5 caixas com agendamento automático de revisão (1/2/4/7/15 dias) |
| **Questões com IA** | Múltipla escolha gerada por Claude com gabarito e explicação comentada |
| **Revisão do Dia** | Sessão diária com todos os cards vencidos, cruzando concursos |
| **Multi-concurso** | Gerencie quantos concursos quiser, cada um com plano, cards e questões próprios |
| **Dashboard** | Visão geral com contadores animados de tópicos estudados e cards dominados |
| **Toggle dark/light** | Tema escuro por padrão, alternável com persistência em localStorage |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, RSC, async params) |
| Banco de dados | Supabase — PostgreSQL + Auth + Row Level Security |
| IA | Anthropic Claude `claude-sonnet-4-6` |
| Estilo | Tailwind CSS v4 + shadcn/ui |
| Animações | Framer Motion + GSAP |
| 3D | Three.js (tela de login) |
| Componentes UI | shadcn/ui (Button, Card, Badge, Input) |
| Linguagem | TypeScript (strict) |

---

## Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com)
- Chave de API na [Anthropic](https://console.anthropic.com)

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
ANTHROPIC_API_KEY=sk-ant-...
```

> As chaves do Supabase estão em **Project Settings → API**.  
> A chave Anthropic está em **console.anthropic.com → API Keys**.

### 3. Banco de dados

Execute no SQL Editor do Supabase, nesta ordem:

```
supabase/schema.sql   →  tabelas, RLS e índices
supabase/seed.sql     →  dados de exemplo — Banco do Brasil 2023 (opcional)
```

### 4. Rodar localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Estrutura do projeto

```
gabarito_AI/
├── app/
│   ├── api/
│   │   ├── criar-com-edital/   # Upload + extração + geração do plano via IA
│   │   ├── gerar-flashcards/   # Geração de cards por disciplina
│   │   ├── gerar-questoes/     # Geração de questões com alternativas
│   │   └── gerar-plano/        # Reimportação de edital
│   ├── concurso/[id]/          # Detalhes do concurso (plano, flashcards, questões)
│   ├── revisao/                # Sessão de Revisão do Dia (Leitner cross-concurso)
│   ├── configuracoes/          # Configurações (em breve)
│   ├── estatisticas/           # Estatísticas (em breve)
│   └── login/                  # Autenticação com Three.js background
├── components/
│   ├── ui/                     # shadcn/ui — Button, Card, Badge, Input
│   ├── Sidebar.tsx             # Navegação lateral com Framer Motion
│   ├── ShellLayout.tsx         # Shell: sidebar + header + footer + drawer mobile
│   ├── ThreeBackground.tsx     # Canvas Three.js (partículas + orbs)
│   ├── HomeClient.tsx          # Dashboard com stats animados
│   ├── ConcursoCard.tsx        # Card com hover animado
│   ├── ConcursoDetail.tsx      # Página de concurso com tabs animadas
│   ├── PlanoTab.tsx            # Plano de estudos com accordion Framer Motion
│   ├── FlashcardTab.tsx        # Flashcards com flip animado
│   ├── QuestaoTab.tsx          # Questões com alternativas interativas
│   ├── RevisaoClient.tsx       # Sessão de revisão diária
│   └── ProgressBar.tsx         # Barra com animação GSAP
├── lib/
│   ├── anthropic.ts            # Cliente Anthropic (server-side)
│   ├── leitner.ts              # Lógica Leitner — boxes 1-5, intervalos, isDue()
│   ├── theme.tsx               # ThemeContext — dark/light com localStorage
│   ├── utils.ts                # cn() helper (clsx + tailwind-merge)
│   └── supabase/               # Clientes server e client do Supabase
├── supabase/
│   ├── schema.sql              # DDL completo com RLS
│   └── seed.sql                # Seed — BB Agente de Tecnologia 2023
└── types/                      # Interfaces TypeScript (Concurso, Disciplina, etc.)
```

---

## Rotas de API

| Endpoint | Método | Descrição |
|---|---|---|
| `/api/criar-com-edital` | `POST` (multipart) | Cria concurso + processa edital + gera plano |
| `/api/gerar-plano` | `POST` (JSON) | Gera/reimporta plano a partir de texto do edital |
| `/api/gerar-flashcards` | `POST` (JSON) | Gera flashcards para uma disciplina |
| `/api/gerar-questoes` | `POST` (JSON) | Gera questões de múltipla escolha para uma disciplina |

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

---

## Deploy

O projeto é compatível com **Vercel** out of the box.

1. Importe o repositório no [vercel.com](https://vercel.com)
2. Configure as variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`)
3. Deploy automático a cada push na `main`

---

## Licença

MIT — use, modifique e distribua livremente.
