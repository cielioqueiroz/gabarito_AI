-- Gabarito App — Database Schema
-- Run this in the Supabase SQL editor

create extension if not exists "pgcrypto";

-- ─── Concursos ────────────────────────────────────────────────────────────────
create table concursos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  nome       text not null,
  cargo      text,
  ano        text,
  banca      text,
  created_at timestamptz default now()
);
alter table concursos enable row level security;
create policy "concursos: own rows" on concursos
  for all using (auth.uid() = user_id);

-- ─── Disciplinas ──────────────────────────────────────────────────────────────
create table disciplinas (
  id          uuid primary key default gen_random_uuid(),
  concurso_id uuid not null references concursos(id) on delete cascade,
  nome        text not null,
  ordem       int  default 0
);
alter table disciplinas enable row level security;
create policy "disciplinas: own rows" on disciplinas
  for all using (
    exists (
      select 1 from concursos c
      where c.id = disciplinas.concurso_id and c.user_id = auth.uid()
    )
  );

-- ─── Tópicos ──────────────────────────────────────────────────────────────────
create table topicos (
  id             uuid    primary key default gen_random_uuid(),
  disciplina_id  uuid    not null references disciplinas(id) on delete cascade,
  texto          text    not null,
  estudado       boolean default false,
  ordem          int     default 0
);
alter table topicos enable row level security;
create policy "topicos: own rows" on topicos
  for all using (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = topicos.disciplina_id and c.user_id = auth.uid()
    )
  );

-- ─── Flashcards ───────────────────────────────────────────────────────────────
create table flashcards (
  id             uuid        primary key default gen_random_uuid(),
  disciplina_id  uuid        not null references disciplinas(id) on delete cascade,
  frente         text        not null,
  verso          text        not null,
  box            int         default 1,
  prox_revisao   timestamptz default now(),
  created_at     timestamptz default now()
);
alter table flashcards enable row level security;
create policy "flashcards: own rows" on flashcards
  for all using (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = flashcards.disciplina_id and c.user_id = auth.uid()
    )
  );

-- ─── Questões ─────────────────────────────────────────────────────────────────
create table questoes (
  id             uuid        primary key default gen_random_uuid(),
  disciplina_id  uuid        not null references disciplinas(id) on delete cascade,
  enunciado      text        not null,
  alternativas   jsonb       not null,
  correta        text        not null,
  explicacao     text,
  created_at     timestamptz default now()
);
alter table questoes enable row level security;
create policy "questoes: own rows" on questoes
  for all using (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = questoes.disciplina_id and c.user_id = auth.uid()
    )
  );

-- ─── Respostas ────────────────────────────────────────────────────────────────
create table respostas (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  questao_id    uuid        not null references questoes(id) on delete cascade,
  acertou       boolean     not null,
  respondido_em timestamptz default now()
);
alter table respostas enable row level security;
create policy "respostas: own rows" on respostas
  for all using (auth.uid() = user_id);
