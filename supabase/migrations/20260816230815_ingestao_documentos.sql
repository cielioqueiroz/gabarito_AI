alter table questoes add column if not exists origem text default 'ia';
alter table questoes add column if not exists numero int;
alter table questoes add column if not exists topico text;

do $$ begin
  alter table questoes add constraint questoes_origem_check check (origem in ('ia', 'prova'));
exception when duplicate_object then null;
end $$;

comment on column questoes.origem is 'prova = transcrita de prova oficial enviada pelo usuario; ia = gerada pelo modelo';
comment on column questoes.numero is 'numero da questao na prova original, quando origem = prova';

create index if not exists questoes_origem_idx on questoes (origem);

create unique index if not exists questoes_prova_unica_idx
  on questoes (disciplina_id, numero)
  where origem = 'prova' and numero is not null;

alter table concursos add column if not exists fonte text default 'manual';

do $$ begin
  alter table concursos add constraint concursos_fonte_check check (fonte in ('manual', 'edital', 'prova'));
exception when duplicate_object then null;
end $$;

comment on column concursos.fonte is 'manual | edital | prova — documento que originou o plano';

alter table disciplinas add column if not exists peso int;
comment on column disciplinas.peso is 'no de questoes que a banca cobra desta disciplina';
