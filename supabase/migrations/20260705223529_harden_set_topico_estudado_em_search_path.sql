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
