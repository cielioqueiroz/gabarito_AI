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
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists concursos_user_id_idx on concursos (user_id);

-- ─── Disciplinas ──────────────────────────────────────────────────────────────
create table disciplinas (
  id          uuid primary key default gen_random_uuid(),
  concurso_id uuid not null references concursos(id) on delete cascade,
  nome        text not null,
  ordem       int  default 0
);
alter table disciplinas enable row level security;
create policy "disciplinas: own rows" on disciplinas
  for all
  using (
    exists (
      select 1 from concursos c
      where c.id = disciplinas.concurso_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from concursos c
      where c.id = disciplinas.concurso_id and c.user_id = auth.uid()
    )
  );

create index if not exists disciplinas_concurso_id_idx on disciplinas (concurso_id);

-- ─── Tópicos ──────────────────────────────────────────────────────────────────
create table topicos (
  id             uuid    primary key default gen_random_uuid(),
  disciplina_id  uuid    not null references disciplinas(id) on delete cascade,
  texto          text    not null,
  estudado       boolean default false,
  estudado_em    timestamptz,
  ordem          int     default 0
);
alter table topicos enable row level security;
create policy "topicos: own rows" on topicos
  for all
  using (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = topicos.disciplina_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = topicos.disciplina_id and c.user_id = auth.uid()
    )
  );

create index if not exists topicos_disciplina_id_idx on topicos (disciplina_id);

-- Track when tópico was studied for analytics.
-- security definer + fixed empty search_path avoids the mutable-search-path
-- advisory warning (function can't be hijacked via a rogue schema on the path).
create or replace function set_topico_estudado_em()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.estudado is true and (old.estudado is distinct from true) then
    new.estudado_em := now();
  end if;
  return new;
end $$;
drop trigger if exists topicos_estudado_em on topicos;
create trigger topicos_estudado_em before update on topicos
  for each row execute function set_topico_estudado_em();

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
  for all
  using (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = flashcards.disciplina_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = flashcards.disciplina_id and c.user_id = auth.uid()
    )
  );

create index if not exists flashcards_disciplina_id_idx on flashcards (disciplina_id);
create index if not exists flashcards_prox_revisao_idx on flashcards (prox_revisao);

-- ─── Questões ─────────────────────────────────────────────────────────────────
create table questoes (
  id             uuid        primary key default gen_random_uuid(),
  disciplina_id  uuid        not null references disciplinas(id) on delete cascade,
  enunciado      text        not null,
  alternativas   jsonb       not null,
  correta        text        not null,
  explicacao     text,
  dificuldade    text        check (dificuldade in ('facil', 'medio', 'dificil')) default 'medio',
  tags           text[]      default '{}',
  created_at     timestamptz default now()
);

-- Migration: add columns if the table pre-existed
alter table questoes add column if not exists dificuldade text default 'medio';
alter table questoes add column if not exists tags text[] default '{}';
create index if not exists questoes_tags_idx on questoes using gin (tags);
create index if not exists questoes_dificuldade_idx on questoes (dificuldade);
alter table questoes enable row level security;
create policy "questoes: own rows" on questoes
  for all
  using (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = questoes.disciplina_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = questoes.disciplina_id and c.user_id = auth.uid()
    )
  );

create index if not exists questoes_disciplina_id_idx on questoes (disciplina_id);

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
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists respostas_user_id_idx on respostas (user_id);
create index if not exists respostas_questao_id_idx on respostas (questao_id);
create index if not exists respostas_respondido_em_idx on respostas (respondido_em);

-- ─── Resumos ──────────────────────────────────────────────────────────────────
-- Bloco idempotente: pode rodar só ele no SQL Editor se as outras tabelas já existem.
create table if not exists resumos (
  id            uuid        primary key default gen_random_uuid(),
  disciplina_id uuid        not null references disciplinas(id) on delete cascade,
  titulo        text        not null,
  conteudo      text        not null,   -- markdown gerado pela IA
  created_at    timestamptz default now()
);
alter table resumos enable row level security;
drop policy if exists "resumos: own rows" on resumos;
create policy "resumos: own rows" on resumos
  for all
  using (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = resumos.disciplina_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = resumos.disciplina_id and c.user_id = auth.uid()
    )
  );

create index if not exists resumos_disciplina_id_idx on resumos (disciplina_id);

-- ─── Stats view ───────────────────────────────────────────────────────────────
create or replace view concurso_stats
with (security_invoker = true) as
select
  c.id                                                            as concurso_id,
  c.user_id                                                       as user_id,
  count(distinct t.id)                                            as topicos_total,
  count(distinct t.id) filter (where t.estudado)                  as topicos_estudados,
  count(distinct f.id)                                            as flashcards_total,
  count(distinct f.id) filter (where f.box >= 4)                  as flashcards_dominados,
  count(distinct q.id)                                            as questoes_total
from concursos c
left join disciplinas d on d.concurso_id = c.id
left join topicos     t on t.disciplina_id = d.id
left join flashcards  f on f.disciplina_id = d.id
left join questoes    q on q.disciplina_id = d.id
group by c.id, c.user_id;

-- ─── Estatísticas por disciplina ──────────────────────────────────────────────
create or replace view disciplina_stats
with (security_invoker = true) as
select
  d.id                                        as disciplina_id,
  d.concurso_id                               as concurso_id,
  d.nome                                      as nome,
  count(distinct r.id)                        as respostas_total,
  count(distinct r.id) filter (where r.acertou) as respostas_corretas
from disciplinas d
left join questoes  q on q.disciplina_id = d.id
left join respostas r on r.questao_id   = q.id
group by d.id, d.concurso_id, d.nome;

-- ─── Ingestão de documentos (2026-08-14) ─────────────────────────────────────
-- Mantido idempotente; espelha supabase/migrations/20260814_ingestao_documentos.sql
-- ─── Questões: distinguir prova oficial de questão gerada pela IA ────────────
alter table questoes add column if not exists origem text default 'ia';
alter table questoes add column if not exists numero int;
alter table questoes add column if not exists topico text;

do $$ begin
  alter table questoes add constraint questoes_origem_check
    check (origem in ('ia', 'prova'));
exception when duplicate_object then null;
end $$;

comment on column questoes.origem is 'prova = transcrita de prova oficial enviada pelo usuário; ia = gerada pelo modelo';
comment on column questoes.numero is 'número da questão na prova original, quando origem = prova';

create index if not exists questoes_origem_idx on questoes (origem);

-- Reimportar a mesma prova não duplica as questões.
create unique index if not exists questoes_prova_unica_idx
  on questoes (disciplina_id, numero)
  where origem = 'prova' and numero is not null;

-- ─── Concursos: de onde veio o plano ─────────────────────────────────────────
alter table concursos add column if not exists fonte text default 'manual';

do $$ begin
  alter table concursos add constraint concursos_fonte_check
    check (fonte in ('manual', 'edital', 'prova'));
exception when duplicate_object then null;
end $$;

comment on column concursos.fonte is 'manual | edital | prova — documento que originou o plano';

-- ─── Disciplinas: peso da disciplina na prova ────────────────────────────────
-- Quantas questões a banca cobra da disciplina. É o que permite priorizar o
-- estudo pelo que cai mais, em vez de tratar todas as disciplinas por igual.
alter table disciplinas add column if not exists peso int;
comment on column disciplinas.peso is 'nº de questões que a banca cobra desta disciplina';

-- ─── Stats: separar questões oficiais das geradas ────────────────────────────
create or replace view concurso_stats
with (security_invoker = true) as
select
  c.id                                                             as concurso_id,
  c.user_id                                                        as user_id,
  count(distinct t.id)                                             as topicos_total,
  count(distinct t.id) filter (where t.estudado)                   as topicos_estudados,
  count(distinct f.id)                                             as flashcards_total,
  count(distinct f.id) filter (where f.box >= 4)                   as flashcards_dominados,
  count(distinct q.id)                                             as questoes_total,
  count(distinct q.id) filter (where q.origem = 'prova')           as questoes_de_prova
from concursos c
left join disciplinas d on d.concurso_id = c.id
left join topicos     t on t.disciplina_id = d.id
left join flashcards  f on f.disciplina_id = d.id
left join questoes    q on q.disciplina_id = d.id
group by c.id, c.user_id;
