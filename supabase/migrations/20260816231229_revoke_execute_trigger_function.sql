-- O trigger continua funcionando como dono da tabela e não precisa ser RPC.
revoke execute on function public.set_topico_estudado_em() from public;
revoke execute on function public.set_topico_estudado_em() from anon;
revoke execute on function public.set_topico_estudado_em() from authenticated;
