-- Allows users to revoke selected sessions without exposing auth.sessions.
create or replace function public.revoke_my_auth_sessions(target_session_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_session_id uuid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
  revoked_count integer;
begin
  if auth.uid() is null then
    raise exception 'Autenticação necessária.';
  end if;

  delete from auth.sessions
  where user_id = auth.uid()
    and id = any(coalesce(target_session_ids, array[]::uuid[]))
    and id is distinct from current_session_id;

  get diagnostics revoked_count = row_count;
  return revoked_count;
end;
$$;

revoke all on function public.revoke_my_auth_sessions(uuid[]) from public, anon;
grant execute on function public.revoke_my_auth_sessions(uuid[]) to authenticated;
