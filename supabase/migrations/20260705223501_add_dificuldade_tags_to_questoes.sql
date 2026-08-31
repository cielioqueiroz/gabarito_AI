alter table questoes add column if not exists dificuldade text default 'medio';
alter table questoes add column if not exists tags text[] default '{}';
create index if not exists questoes_tags_idx on questoes using gin (tags);
create index if not exists questoes_dificuldade_idx on questoes (dificuldade);
