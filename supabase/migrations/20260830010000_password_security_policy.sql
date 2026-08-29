-- Politica de senha configuravel pelo admin (tamanho minimo) e visibilidade,
-- pro admin, do status de seguranca de contas que ele mesmo provisiona
-- (aguardando troca de senha, nunca acessou) -- hoje essa informacao existe
-- só em auth.users, que o client normal nao enxerga.

alter table public.platform_settings
  add column if not exists min_password_length integer not null default 8
    check (min_password_length between 8 and 64);

create or replace function public.get_account_security_status(target_user_ids uuid[])
returns table (
  user_id uuid,
  email_confirmed boolean,
  must_change_password boolean,
  last_sign_in_at timestamptz
)
language sql stable security definer set search_path = public, auth
as $$
  select
    u.id as user_id,
    u.email_confirmed_at is not null as email_confirmed,
    coalesce((u.raw_user_meta_data ->> 'must_change_password')::boolean, false) as must_change_password,
    u.last_sign_in_at
  from auth.users u
  where u.id = any(target_user_ids)
    and public.is_master_admin();
$$;

revoke all on function public.get_account_security_status(uuid[]) from public, anon;
grant execute on function public.get_account_security_status(uuid[]) to authenticated;
