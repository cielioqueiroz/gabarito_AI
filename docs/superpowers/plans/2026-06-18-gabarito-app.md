# Gabarito App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "Gabarito" — a full-stack Next.js 15 study app for Brazilian public competitions (concursos públicos) with Supabase auth, spaced repetition flashcards, multiple-choice questions, and AI-powered content generation.

**Architecture:** Next.js 15 App Router with server components for data fetching, client components for interactive study modes. Supabase handles auth + PostgreSQL with RLS. All Anthropic API calls are made exclusively in server-side route handlers.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Supabase (SSR), @anthropic-ai/sdk, shadcn/ui-style primitives (hand-rolled).

## Global Constraints

- Next.js 15 App Router only — no Pages Router
- TypeScript strict mode
- All Anthropic API calls server-side only, never in client components
- Supabase RLS enabled on every table
- Model: `claude-sonnet-4-6`
- Tailwind design tokens: slate-50 base, blue-600 accent, emerald-500 success, amber warn
- Font: sans for titles, mono for labels/data (tracking-widest uppercase text-[10px])
- Responsive down to mobile, visible focus rings, respect prefers-reduced-motion

---

## File Map

| File | Responsibility |
|------|---------------|
| `types/index.ts` | All shared TypeScript interfaces |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/server.ts` | Server Supabase client (cookies) |
| `lib/anthropic.ts` | Anthropic SDK singleton |
| `lib/leitner.ts` | Leitner box progression logic |
| `app/layout.tsx` | Root layout, wordmark, global nav |
| `app/page.tsx` | Home: list concursos, create, delete |
| `app/login/page.tsx` | Email/password login + signup |
| `app/concurso/[id]/page.tsx` | Concurso detail with tab nav |
| `components/ConcursoCard.tsx` | Card with progress bars per concurso |
| `components/ProgressBar.tsx` | Reusable animated progress bar |
| `components/PlanoTab.tsx` | Topics checklist + discipline progress |
| `components/FlashcardCard.tsx` | Flip card + Leitner controls |
| `components/QuestaoCard.tsx` | MCQ card with correction + explanation |
| `app/api/gerar-plano/route.ts` | POST: edital text → disciplines + topics |
| `app/api/gerar-flashcards/route.ts` | POST: discipline → flashcards |
| `app/api/gerar-questoes/route.ts` | POST: discipline → questions |
| `supabase/schema.sql` | Full DDL + RLS policies |
| `supabase/seed.sql` | BB 2023 initial data |
| `middleware.ts` | Auth guard: redirect unauthenticated to /login |

---

## Task 1: Scaffold + Dependencies

**Files:**
- Create: all root config files via `create-next-app`
- Modify: `package.json` (add deps), `tailwind.config.ts`, `next.config.ts`

- [ ] **Step 1: Scaffold Next.js 15**

```bash
cd d:/Projetos_Programacao/gabarito-app
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --no-eslint --yes
```

Expected: package.json, tsconfig.json, app/, tailwind.config.ts, next.config.ts

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk
```

- [ ] **Step 3: Create .env.local**

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_key
EOF
```

---

## Task 2: Types + Lib Foundation

**Files:**
- Create: `types/index.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/anthropic.ts`
- Create: `lib/leitner.ts`

**Produces:**
- `Concurso`, `Disciplina`, `Topico`, `Flashcard`, `Questao`, `Resposta`, `Alternativa` interfaces
- `createBrowserClient()`, `createServerClient()` functions
- `anthropic` singleton
- `advanceBox(box, acertou)` → `{ box: number, proxRevisao: Date }`

- [ ] **Step 1: Create types/index.ts**

```typescript
export interface Concurso {
  id: string
  user_id: string
  nome: string
  cargo: string | null
  ano: string | null
  banca: string | null
  created_at: string
}

export interface Disciplina {
  id: string
  concurso_id: string
  nome: string
  ordem: number
}

export interface Topico {
  id: string
  disciplina_id: string
  texto: string
  estudado: boolean
  ordem: number
}

export interface Alternativa {
  letra: string
  texto: string
}

export interface Flashcard {
  id: string
  disciplina_id: string
  frente: string
  verso: string
  box: number
  prox_revisao: string
  created_at: string
}

export interface Questao {
  id: string
  disciplina_id: string
  enunciado: string
  alternativas: Alternativa[]
  correta: string
  explicacao: string | null
  created_at: string
}

export interface Resposta {
  id: string
  user_id: string
  questao_id: string
  acertou: boolean
  respondido_em: string
}
```

- [ ] **Step 2: Create lib/supabase/client.ts**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Create lib/supabase/server.ts**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 4: Create lib/anthropic.ts**

```typescript
import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})
```

- [ ] **Step 5: Create lib/leitner.ts**

```typescript
const INTERVALS_DAYS: Record<number, number> = {
  1: 1, 2: 2, 3: 4, 4: 7, 5: 15,
}

export function advanceBox(currentBox: number, acertou: boolean): { box: number; proxRevisao: Date } {
  const box = acertou ? Math.min(5, currentBox + 1) : 1
  const days = INTERVALS_DAYS[box]
  const proxRevisao = new Date()
  if (acertou) proxRevisao.setDate(proxRevisao.getDate() + days)
  return { box, proxRevisao }
}
```

---

## Task 3: Supabase Schema + Seed SQL

**Files:**
- Create: `supabase/schema.sql`
- Create: `supabase/seed.sql`

- [ ] **Step 1: Create supabase/schema.sql**

```sql
-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Concursos
create table concursos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  cargo text,
  ano text,
  banca text,
  created_at timestamptz default now()
);
alter table concursos enable row level security;
create policy "users see own concursos" on concursos
  for all using (auth.uid() = user_id);

-- Disciplinas
create table disciplinas (
  id uuid primary key default gen_random_uuid(),
  concurso_id uuid not null references concursos(id) on delete cascade,
  nome text not null,
  ordem int default 0
);
alter table disciplinas enable row level security;
create policy "users see own disciplinas" on disciplinas
  for all using (
    exists (select 1 from concursos c where c.id = disciplinas.concurso_id and c.user_id = auth.uid())
  );

-- Topicos
create table topicos (
  id uuid primary key default gen_random_uuid(),
  disciplina_id uuid not null references disciplinas(id) on delete cascade,
  texto text not null,
  estudado boolean default false,
  ordem int default 0
);
alter table topicos enable row level security;
create policy "users see own topicos" on topicos
  for all using (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = topicos.disciplina_id and c.user_id = auth.uid()
    )
  );

-- Flashcards
create table flashcards (
  id uuid primary key default gen_random_uuid(),
  disciplina_id uuid not null references disciplinas(id) on delete cascade,
  frente text not null,
  verso text not null,
  box int default 1,
  prox_revisao timestamptz default now(),
  created_at timestamptz default now()
);
alter table flashcards enable row level security;
create policy "users see own flashcards" on flashcards
  for all using (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = flashcards.disciplina_id and c.user_id = auth.uid()
    )
  );

-- Questoes
create table questoes (
  id uuid primary key default gen_random_uuid(),
  disciplina_id uuid not null references disciplinas(id) on delete cascade,
  enunciado text not null,
  alternativas jsonb not null,
  correta text not null,
  explicacao text,
  created_at timestamptz default now()
);
alter table questoes enable row level security;
create policy "users see own questoes" on questoes
  for all using (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = questoes.disciplina_id and c.user_id = auth.uid()
    )
  );

-- Respostas
create table respostas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  questao_id uuid not null references questoes(id) on delete cascade,
  acertou boolean not null,
  respondido_em timestamptz default now()
);
alter table respostas enable row level security;
create policy "users see own respostas" on respostas
  for all using (auth.uid() = user_id);
```

---

## Task 4: Middleware + Auth

**Files:**
- Create: `middleware.ts`
- Create: `app/login/page.tsx`

- [ ] **Step 1: Create middleware.ts** — redirects unauthenticated users to /login

- [ ] **Step 2: Create app/login/page.tsx** — email/password form with sign-in + sign-up tabs

---

## Task 5: Root Layout + Home Page

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `app/page.tsx`
- Create: `components/ProgressBar.tsx`
- Create: `components/ConcursoCard.tsx`

---

## Task 6: Concurso Detail Page + Tabs

**Files:**
- Create: `app/concurso/[id]/page.tsx`

---

## Task 7: PlanoTab Component

**Files:**
- Create: `components/PlanoTab.tsx`

---

## Task 8: FlashcardCard + Study Mode

**Files:**
- Create: `components/FlashcardCard.tsx`

---

## Task 9: QuestaoCard + Answers

**Files:**
- Create: `components/QuestaoCard.tsx`

---

## Task 10: AI Route Handlers

**Files:**
- Create: `app/api/gerar-plano/route.ts`
- Create: `app/api/gerar-flashcards/route.ts`
- Create: `app/api/gerar-questoes/route.ts`

---

## Task 11: AI Generation UI

**Files:**
- Create: `components/GerarPlanoModal.tsx`
- Modify: `app/concurso/[id]/page.tsx` (add generate buttons per discipline)

---

## Task 12: Seed SQL (BB 2023)

**Files:**
- Modify: `supabase/seed.sql`

Full seed with the Banco do Brasil 2023 concurso, all 10 disciplines, topics, initial flashcards and questions from the briefing.

---

## Task 13: Polish

- Global CSS custom properties, wordmark cursor blink animation
- Mobile responsiveness audit
- Focus rings on all interactive elements
- prefers-reduced-motion guards on flip animations
