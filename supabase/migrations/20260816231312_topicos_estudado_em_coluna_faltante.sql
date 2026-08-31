alter table topicos add column if not exists estudado_em timestamptz;

comment on column topicos.estudado_em is 'preenchido pelo trigger set_topico_estudado_em na primeira vez que estudado vira true';
