-- As policies usam initplan para calcular auth.uid() uma vez por consulta.
drop policy if exists "concursos: own rows" on public.concursos;
create policy "concursos: own rows" on public.concursos
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "disciplinas: own rows" on public.disciplinas;
create policy "disciplinas: own rows" on public.disciplinas
  for all to authenticated
  using (exists (
    select 1 from public.concursos c
    where c.id = disciplinas.concurso_id
      and c.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.concursos c
    where c.id = disciplinas.concurso_id
      and c.user_id = (select auth.uid())
  ));

drop policy if exists "topicos: own rows" on public.topicos;
create policy "topicos: own rows" on public.topicos
  for all to authenticated
  using (exists (
    select 1 from public.disciplinas d
    join public.concursos c on c.id = d.concurso_id
    where d.id = topicos.disciplina_id
      and c.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.disciplinas d
    join public.concursos c on c.id = d.concurso_id
    where d.id = topicos.disciplina_id
      and c.user_id = (select auth.uid())
  ));

drop policy if exists "flashcards: own rows" on public.flashcards;
create policy "flashcards: own rows" on public.flashcards
  for all to authenticated
  using (exists (
    select 1 from public.disciplinas d
    join public.concursos c on c.id = d.concurso_id
    where d.id = flashcards.disciplina_id
      and c.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.disciplinas d
    join public.concursos c on c.id = d.concurso_id
    where d.id = flashcards.disciplina_id
      and c.user_id = (select auth.uid())
  ));

drop policy if exists "questoes: own rows" on public.questoes;
create policy "questoes: own rows" on public.questoes
  for all to authenticated
  using (exists (
    select 1 from public.disciplinas d
    join public.concursos c on c.id = d.concurso_id
    where d.id = questoes.disciplina_id
      and c.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.disciplinas d
    join public.concursos c on c.id = d.concurso_id
    where d.id = questoes.disciplina_id
      and c.user_id = (select auth.uid())
  ));

-- Impede que uma resposta aponte para questão de outro concurso.
drop policy if exists "respostas: own rows" on public.respostas;
create policy "respostas: own rows" on public.respostas
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.questoes q
      join public.disciplinas d on d.id = q.disciplina_id
      join public.concursos c on c.id = d.concurso_id
      where q.id = respostas.questao_id
        and c.user_id = (select auth.uid())
    )
  );

drop policy if exists "resumos: own rows" on public.resumos;
create policy "resumos: own rows" on public.resumos
  for all to authenticated
  using (exists (
    select 1 from public.disciplinas d
    join public.concursos c on c.id = d.concurso_id
    where d.id = resumos.disciplina_id
      and c.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.disciplinas d
    join public.concursos c on c.id = d.concurso_id
    where d.id = resumos.disciplina_id
      and c.user_id = (select auth.uid())
  ));

create index if not exists concursos_user_id_idx on public.concursos (user_id);
create index if not exists disciplinas_concurso_id_idx on public.disciplinas (concurso_id);
create index if not exists topicos_disciplina_id_idx on public.topicos (disciplina_id);
create index if not exists flashcards_disciplina_id_idx on public.flashcards (disciplina_id);
create index if not exists respostas_user_id_idx on public.respostas (user_id);
create index if not exists respostas_questao_id_idx on public.respostas (questao_id);

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

create or replace function check_rate_limit(p_scope text, p_max int, p_window_seconds int default 60)
returns table(allowed boolean, retry_after int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now  timestamptz := now();
  v_user uuid := auth.uid();
  v_row  public.api_rate_limits%rowtype;
begin
  if v_user is null
    or p_scope = ''
    or char_length(p_scope) > 64
    or p_max not between 1 and 500
    or p_window_seconds not between 1 and 3600
  then
    return query select false, p_window_seconds;
    return;
  end if;

  insert into public.api_rate_limits (user_id, scope, window_start, request_count)
  values (v_user, p_scope, v_now, 1)
  on conflict (user_id, scope) do update set
    window_start = case
      when api_rate_limits.window_start <= v_now - make_interval(secs => p_window_seconds) then v_now
      else api_rate_limits.window_start
    end,
    request_count = case
      when api_rate_limits.window_start <= v_now - make_interval(secs => p_window_seconds) then 1
      else api_rate_limits.request_count + 1
    end
  returning * into v_row;

  return query select
    v_row.request_count <= p_max,
    case when v_row.request_count <= p_max then 0 else greatest(
      1,
      ceil(extract(epoch from v_row.window_start + make_interval(secs => p_window_seconds) - v_now))::int
    ) end;
end $$;

revoke execute on function public.check_rate_limit(text, int, int) from public, anon;
grant execute on function public.check_rate_limit(text, int, int) to authenticated;

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
