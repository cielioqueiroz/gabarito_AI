create or replace view concurso_stats
with (security_invoker = true) as
select
  c.id                                                    as concurso_id,
  c.user_id                                               as user_id,
  count(distinct t.id)                                    as topicos_total,
  count(distinct t.id) filter (where t.estudado)          as topicos_estudados,
  count(distinct f.id)                                    as flashcards_total,
  count(distinct f.id) filter (where f.box >= 4)          as flashcards_dominados,
  count(distinct q.id)                                    as questoes_total,
  count(distinct q.id) filter (where q.origem = 'prova')  as questoes_de_prova
from concursos c
left join disciplinas d on d.concurso_id = c.id
left join topicos     t on t.disciplina_id = d.id
left join flashcards  f on f.disciplina_id = d.id
left join questoes    q on q.disciplina_id = d.id
group by c.id, c.user_id;

create or replace view disciplina_stats
with (security_invoker = true) as
select
  d.id                                          as disciplina_id,
  d.concurso_id                                 as concurso_id,
  d.nome                                        as nome,
  count(distinct r.id)                          as respostas_total,
  count(distinct r.id) filter (where r.acertou) as respostas_corretas
from disciplinas d
left join questoes  q on q.disciplina_id = d.id
left join respostas r on r.questao_id   = q.id
group by d.id, d.concurso_id, d.nome;
