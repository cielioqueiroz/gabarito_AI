-- Uma resposta por (usuário, questão).
--
-- O estado de "já respondida" vivia só no client (useState em QuestaoTab); ao
-- recarregar a página dava para responder a mesma questão de novo, e cada insert
-- inflava as estatísticas (a KPI "Questões" e a "Taxa" contam linhas, não
-- questões distintas). /api/responder passou a fazer ler-e-gravar; este índice
-- único é o backstop no banco.
--
-- A dedup do histórico (apagar as linhas antigas mantendo a resposta mais recente
-- de cada par) foi aplicada no remoto via SQL Editor e foi no-op: havia 0
-- duplicatas. O espelho aqui traz só o índice — idempotente e com o mesmo efeito
-- final, já que não havia o que limpar.
create unique index if not exists respostas_user_questao_idx
  on public.respostas (user_id, questao_id);
