create table if not exists public.platform_representatives (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  status text not null default 'ativo' check (status in ('ativo', 'suspenso')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists platform_representatives_email_idx
  on public.platform_representatives (lower(email));

create table if not exists public.representative_invites (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default replace(gen_random_uuid()::text, '-', ''),
  invited_email text not null,
  status text not null default 'ativo' check (status in ('ativo', 'usado', 'cancelado')),
  created_by uuid not null references auth.users (id) on delete cascade,
  accepted_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.is_master_admin()
returns boolean
language sql stable security definer set search_path = public, auth
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'jeffersonmaycon.sc@gmail.com';
$$;

create or replace function public.is_active_representative()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.platform_representatives
    where user_id = auth.uid() and status = 'ativo'
  );
$$;

create or replace function public.get_my_platform_role()
returns text
language sql stable security definer set search_path = public
as $$
  select case
    when public.is_master_admin() then 'admin'
    when public.is_active_representative() then 'representante'
    else null
  end;
$$;

create or replace function public.create_representative_invite(target_email text)
returns public.representative_invites
language plpgsql security definer set search_path = public
as $$
declare created_invite public.representative_invites;
begin
  if not public.is_master_admin() then
    raise exception 'Somente o Admin master pode convidar representantes.';
  end if;
  if position('@' in trim(target_email)) = 0 then
    raise exception 'Informe um e-mail válido.';
  end if;
  update public.representative_invites set status = 'cancelado'
    where lower(invited_email) = lower(trim(target_email)) and status = 'ativo';
  insert into public.representative_invites (invited_email, created_by)
    values (lower(trim(target_email)), auth.uid()) returning * into created_invite;
  return created_invite;
end;
$$;

create or replace function public.accept_representative_invite(invite_token text)
returns text
language plpgsql security definer set search_path = public, auth
as $$
declare matched_invite public.representative_invites;
declare current_email text;
begin
  if auth.uid() is null then raise exception 'Faça login para aceitar o convite.'; end if;
  current_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  select * into matched_invite from public.representative_invites
    where token = invite_token and status = 'ativo' and expires_at > now() for update;
  if matched_invite.id is null then raise exception 'Convite inválido ou expirado.'; end if;
  if lower(matched_invite.invited_email) <> current_email then
    raise exception 'Este convite pertence a outro e-mail.';
  end if;
  insert into public.platform_representatives (user_id, email, invited_by)
    values (auth.uid(), current_email, matched_invite.created_by)
    on conflict (user_id) do update set email = excluded.email, status = 'ativo', updated_at = now();
  update public.representative_invites set status = 'usado', accepted_by = auth.uid(), accepted_at = now()
    where id = matched_invite.id;
  return 'representante';
end;
$$;

create or replace function public.set_representative_status(target_user_id uuid, next_status text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_master_admin() then
    raise exception 'Somente o Admin master pode alterar representantes.';
  end if;
  if next_status not in ('ativo', 'suspenso') then raise exception 'Status inválido.'; end if;
  update public.platform_representatives set status = next_status, updated_at = now()
    where user_id = target_user_id;
end;
$$;

alter table public.platform_representatives enable row level security;
alter table public.representative_invites enable row level security;
create policy "master_manage_representatives" on public.platform_representatives for all to authenticated
  using (public.is_master_admin()) with check (public.is_master_admin());
create policy "representative_read_self" on public.platform_representatives for select to authenticated
  using (user_id = auth.uid());
create policy "master_manage_representative_invites" on public.representative_invites for all to authenticated
  using (public.is_master_admin()) with check (public.is_master_admin());

revoke all on function public.create_representative_invite(text) from public, anon;
revoke all on function public.accept_representative_invite(text) from public, anon;
revoke all on function public.set_representative_status(uuid, text) from public, anon;
grant execute on function public.get_my_platform_role() to authenticated;
grant execute on function public.create_representative_invite(text) to authenticated;
grant execute on function public.accept_representative_invite(text) to authenticated;
grant execute on function public.set_representative_status(uuid, text) to authenticated;
grant select on public.platform_representatives, public.representative_invites to authenticated;
