-- Borrar la cuenta desde la app (requisito de App Store 5.1.1(v)).
-- Al borrar el usuario de auth.users, el "on delete cascade" elimina sus goals, entries y profile.
-- security definer: corre como el dueño de la función (postgres), que sí puede borrar en auth.users;
-- solo borra la fila del propio usuario que llama (auth.uid()).

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
