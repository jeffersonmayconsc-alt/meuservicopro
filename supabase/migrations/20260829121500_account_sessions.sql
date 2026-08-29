-- Exposes only the authenticated user's own sessions.
create or replace function public.list_my_auth_sessions()
returns table (
  session_id uuid,
  created_at timestamptz,
  last_seen_at timestamptz,
  user_agent text,
  ip_address text,
  is_current boolean
)
language sql
security definer
set search_path = public, auth
stable
as $$
  select
    sessions.id,
    sessions.created_at,
    coalesce(sessions.refreshed_at, sessions.updated_at),
    sessions.user_agent,
    host(sessions.ip),
    sessions.id = nullif(auth.jwt() ->> 'session_id', '')::uuid
  from auth.sessions as sessions
  where sessions.user_id = auth.uid()
    and (sessions.not_after is null or sessions.not_after > now())
  order by 6 desc, 3 desc;
$$;

revoke all on function public.list_my_auth_sessions() from public, anon;
grant execute on function public.list_my_auth_sessions() to authenticated;
