-- O cliente escolhe apenas o escopo; limites e janela são regras do servidor.
revoke execute on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
drop function if exists public.check_rate_limit(text, int, int);

create or replace function public.check_rate_limit(p_scope text)
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
