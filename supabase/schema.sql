-- Gabarito App — Database Schema
-- Run this in the Supabase SQL editor

create extension if not exists "pgcrypto";

-- Rate limit compartilhado entre instâncias serverless.
create table if not exists api_rate_limits (
  user_id       uuid        not null references auth.users(id) on delete cascade,
  scope         text        not null,
  window_start  timestamptz not null,
  request_count int         not null,
  primary key (user_id, scope)
);
alter table api_rate_limits enable row level security;
drop policy if exists "api_rate_limits: no direct access" on api_rate_limits;
create policy "api_rate_limits: no direct access" on api_rate_limits
  for all to anon, authenticated
  using (false)
  with check (false);
revoke all on table public.api_rate_limits from anon, authenticated, public;

drop function if exists public.check_rate_limit(text, int, int);
create or replace function check_rate_limit(p_scope text)
returns table(allowed boolean, retry_after int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now            timestamptz := now();
  v_user           uuid := auth.uid();
  v_max            int;
  v_window_seconds int := 60;
  v_row            public.api_rate_limits%rowtype;
begin
  v_max := case p_scope
    when 'criar-edital' then 5
    when 'gerar-flashcards' then 10
    when 'gerar-plano' then 5
    when 'gerar-questoes' then 10
    when 'gerar-resumo' then 10
    when 'import-deck' then 5
    when 'importar-questoes' then 30
    when 'podcast' then 20
    when 'responder' then 120
    when 'stream-plano' then 5
    else null
  end;

  if v_user is null or v_max is null then
    return query select false, v_window_seconds;
    return;
  end if;

  insert into public.api_rate_limits (user_id, scope, window_start, request_count)
  values (v_user, p_scope, v_now, 1)
  on conflict (user_id, scope) do update set
    window_start = case
      when api_rate_limits.window_start <= v_now - make_interval(secs => v_window_seconds) then v_now
      else api_rate_limits.window_start
    end,
    request_count = case
      when api_rate_limits.window_start <= v_now - make_interval(secs => v_window_seconds) then 1
      else api_rate_limits.request_count + 1
    end
  returning * into v_row;

  return query select
    v_row.request_count <= v_max,
    case when v_row.request_count <= v_max then 0 else greatest(
      1,
      ceil(extract(epoch from v_row.window_start + make_interval(secs => v_window_seconds) - v_now))::int
    ) end;
end $$;

revoke execute on function public.check_rate_limit(text) from public, anon;
grant execute on function public.check_rate_limit(text) to authenticated;

-- ─── Concursos ────────────────────────────────────────────────────────────────
create table if not exists concursos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  nome       text not null,
  cargo      text,
  ano        text,
  banca      text,
  created_at timestamptz default now()
);
alter table concursos enable row level security;
drop policy if exists "concursos: own rows" on concursos;
create policy "concursos: own rows" on concursos
  for all to authenticated
  using      ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists concursos_user_id_idx on concursos (user_id);

-- ─── Disciplinas ──────────────────────────────────────────────────────────────
create table if not exists disciplinas (
  id          uuid primary key default gen_random_uuid(),
  concurso_id uuid not null references concursos(id) on delete cascade,
  nome        text not null,
  ordem       int  default 0
);
alter table disciplinas enable row level security;
drop policy if exists "disciplinas: own rows" on disciplinas;
create policy "disciplinas: own rows" on disciplinas
  for all to authenticated
  using (
    exists (
      select 1 from concursos c
      where c.id = disciplinas.concurso_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from concursos c
      where c.id = disciplinas.concurso_id and c.user_id = (select auth.uid())
    )
  );

create index if not exists disciplinas_concurso_id_idx on disciplinas (concurso_id);

-- ─── Tópicos ──────────────────────────────────────────────────────────────────
create table if not exists topicos (
  id             uuid    primary key default gen_random_uuid(),
  disciplina_id  uuid    not null references disciplinas(id) on delete cascade,
  texto          text    not null,
  estudado       boolean default false,
  estudado_em    timestamptz,
  ordem          int     default 0
);
alter table topicos enable row level security;
drop policy if exists "topicos: own rows" on topicos;
create policy "topicos: own rows" on topicos
  for all to authenticated
  using (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = topicos.disciplina_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = topicos.disciplina_id and c.user_id = (select auth.uid())
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

-- A funcao so deve rodar pelo trigger. No schema public o PostgREST a expunha
-- em /rest/v1/rpc/ para anon e authenticated e, sendo SECURITY DEFINER, virava
-- superficie de ataque sem uso (advisors 0028/0029 do Supabase).
revoke execute on function public.set_topico_estudado_em() from public;
revoke execute on function public.set_topico_estudado_em() from anon;
revoke execute on function public.set_topico_estudado_em() from authenticated;

-- ─── Flashcards ───────────────────────────────────────────────────────────────
create table if not exists flashcards (
  id             uuid        primary key default gen_random_uuid(),
  disciplina_id  uuid        not null references disciplinas(id) on delete cascade,
  frente         text        not null,
  verso          text        not null,
  box            int         default 1,
  prox_revisao   timestamptz default now(),
  created_at     timestamptz default now()
);
alter table flashcards enable row level security;
drop policy if exists "flashcards: own rows" on flashcards;
create policy "flashcards: own rows" on flashcards
  for all to authenticated
  using (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = flashcards.disciplina_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = flashcards.disciplina_id and c.user_id = (select auth.uid())
    )
  );

create index if not exists flashcards_disciplina_id_idx on flashcards (disciplina_id);
create index if not exists flashcards_prox_revisao_idx on flashcards (prox_revisao);

-- ─── Questões ─────────────────────────────────────────────────────────────────
create table if not exists questoes (
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
drop policy if exists "questoes: own rows" on questoes;
create policy "questoes: own rows" on questoes
  for all to authenticated
  using (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = questoes.disciplina_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = questoes.disciplina_id and c.user_id = (select auth.uid())
    )
  );

create index if not exists questoes_disciplina_id_idx on questoes (disciplina_id);

-- ─── Respostas ────────────────────────────────────────────────────────────────
create table if not exists respostas (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  questao_id    uuid        not null references questoes(id) on delete cascade,
  acertou       boolean     not null,
  respondido_em timestamptz default now()
);
alter table respostas enable row level security;
drop policy if exists "respostas: own rows" on respostas;
create policy "respostas: own rows" on respostas
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from questoes q
      join disciplinas d on d.id = q.disciplina_id
      join concursos c on c.id = d.concurso_id
      where q.id = respostas.questao_id and c.user_id = (select auth.uid())
    )
  );

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
  for all to authenticated
  using (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = resumos.disciplina_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from disciplinas d
      join concursos c on c.id = d.concurso_id
      where d.id = resumos.disciplina_id and c.user_id = (select auth.uid())
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
  c.id                                      as concurso_id,
  c.user_id                                 as user_id,
  coalesce(ts.total, 0)                     as topicos_total,
  coalesce(ts.estudados, 0)                 as topicos_estudados,
  coalesce(fs.total, 0)                     as flashcards_total,
  coalesce(fs.dominados, 0)                 as flashcards_dominados,
  coalesce(qs.total, 0)                     as questoes_total,
  coalesce(qs.de_prova, 0)                  as questoes_de_prova
from concursos c
left join (
  select d.concurso_id, count(t.id) as total,
    count(t.id) filter (where t.estudado) as estudados
  from disciplinas d left join topicos t on t.disciplina_id = d.id
  group by d.concurso_id
) ts on ts.concurso_id = c.id
left join (
  select d.concurso_id, count(f.id) as total,
    count(f.id) filter (where f.box >= 4) as dominados
  from disciplinas d left join flashcards f on f.disciplina_id = d.id
  group by d.concurso_id
) fs on fs.concurso_id = c.id
left join (
  select d.concurso_id, count(q.id) as total,
    count(q.id) filter (where q.origem = 'prova') as de_prova
  from disciplinas d left join questoes q on q.disciplina_id = d.id
  group by d.concurso_id
) qs on qs.concurso_id = c.id;
