-- Ingestão de documentos: questões vindas de prova oficial + origem do concurso.
-- Idempotente: pode rodar direto no SQL Editor do Supabase quantas vezes quiser.

-- ─── Correções encontradas ao restaurar o projeto em 16/08/2026 ──────────────
-- A base de produção estava sem a coluna `topicos.estudado_em`, embora o trigger
-- set_topico_estudado_em a atribua. Resultado: QUALQUER update em topicos falhava
-- com "record new has no field estudado_em" — marcar tópico como estudado estava
-- quebrado. Descoberto por smoke test, não por leitura do schema.
alter table topicos add column if not exists estudado_em timestamptz;
comment on column topicos.estudado_em is 'preenchido pelo trigger na primeira vez que estudado vira true';

-- O trigger só precisa ser disparado pelo trigger. Estando no schema public, o
-- PostgREST o expunha em /rest/v1/rpc/ para anon e authenticated e, sendo
-- SECURITY DEFINER, virava superfície de ataque sem uso. (Advisors do Supabase
-- 0028/0029.) O trigger segue funcionando: roda como dono da tabela.
revoke execute on function public.set_topico_estudado_em() from public;
revoke execute on function public.set_topico_estudado_em() from anon;
revoke execute on function public.set_topico_estudado_em() from authenticated;

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
