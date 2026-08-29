-- Identidades autenticadas ligadas aos cadastros de negócio existentes.
create table if not exists public.provider_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  provider_id text not null unique references public.providers (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.client_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  client_id text not null unique references public.clients (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.providers
  add column if not exists representative_user_id uuid
  references public.platform_representatives (user_id) on delete set null;

alter table public.provider_invites
  add column if not exists created_by_user_id uuid references auth.users (id) on delete set null,
  add column if not exists representative_user_id uuid
    references public.platform_representatives (user_id) on delete set null;

create index if not exists providers_representative_user_id_idx
  on public.providers (representative_user_id);
create index if not exists provider_invites_representative_user_id_idx
  on public.provider_invites (representative_user_id);

create or replace function public.representative_manages_provider(target_provider_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.providers
    where id = target_provider_id and representative_user_id = auth.uid()
  );
$$;

create or replace function public.provider_account_owns(target_provider_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.provider_accounts
    where provider_id = target_provider_id and user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_provider(target_provider_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_master_admin()
    or public.representative_manages_provider(target_provider_id)
    or public.provider_account_owns(target_provider_id);
$$;

create or replace function public.create_scoped_provider_invite(target_email text)
returns public.provider_invites
language plpgsql security definer set search_path = public
as $$
declare created_invite public.provider_invites;
declare responsible_representative uuid;
begin
  if not public.is_master_admin() and not public.is_active_representative() then
    raise exception 'Apenas o Admin master ou um representante ativo pode convidar prestadores.';
  end if;
  if position('@' in trim(target_email)) = 0 then raise exception 'Informe um e-mail válido.'; end if;
  responsible_representative := case when public.is_active_representative() then auth.uid() else null end;
  insert into public.provider_invites (
    id, token, created_by_admin, invited_email, status, expires_at,
    created_by_user_id, representative_user_id
  ) values (
    gen_random_uuid()::text, replace(gen_random_uuid()::text, '-', ''),
    coalesce(auth.jwt() ->> 'email', 'admin'), lower(trim(target_email)), 'ativo',
    now() + interval '7 days', auth.uid(), responsible_representative
  ) returning * into created_invite;
  return created_invite;
end;
$$;

create or replace function public.transfer_provider_representative(
  target_provider_id text,
  target_representative_user_id uuid
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_master_admin() then
    raise exception 'Somente o Admin master pode transferir prestadores.';
  end if;
  if target_representative_user_id is not null and not exists (
    select 1 from public.platform_representatives
    where user_id = target_representative_user_id and status = 'ativo'
  ) then raise exception 'Representante inválido ou suspenso.'; end if;
  update public.providers
    set representative_user_id = target_representative_user_id
    where id = target_provider_id;
end;
$$;

create or replace function public.link_provider_account(target_provider_id text, target_user_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_master_admin() and not public.representative_manages_provider(target_provider_id) then
    raise exception 'Sem permissão para vincular este prestador.';
  end if;
  insert into public.provider_accounts (user_id, provider_id)
    values (target_user_id, target_provider_id)
    on conflict (user_id) do update set provider_id = excluded.provider_id;
end;
$$;

alter table public.provider_accounts enable row level security;
alter table public.client_accounts enable row level security;

create policy "provider_account_scope" on public.provider_accounts for select to authenticated
  using (user_id = auth.uid() or public.is_master_admin() or public.representative_manages_provider(provider_id));
create policy "client_account_self" on public.client_accounts for select to authenticated
  using (user_id = auth.uid() or public.is_master_admin());

-- Substitui apenas o acesso autenticado; o fluxo público anon permanece
-- compatível até ser migrado para RPCs públicas específicas.
drop policy if exists "anon_full_access" on public.providers;
create policy "anon_full_access" on public.providers for all to anon using (true) with check (true);
drop policy if exists "authenticated_scoped_access" on public.providers;
create policy "authenticated_hierarchy_access" on public.providers for all to authenticated
  using (public.can_manage_provider(id)) with check (public.can_manage_provider(id));

drop policy if exists "anon_full_access" on public.provider_services;
create policy "anon_full_access" on public.provider_services for all to anon using (true) with check (true);
drop policy if exists "authenticated_scoped_access" on public.provider_services;
create policy "authenticated_hierarchy_access" on public.provider_services for all to authenticated
  using (public.can_manage_provider(provider_id)) with check (public.can_manage_provider(provider_id));

drop policy if exists "anon_full_access" on public.portfolio_photos;
create policy "anon_full_access" on public.portfolio_photos for all to anon using (true) with check (true);
drop policy if exists "authenticated_scoped_access" on public.portfolio_photos;
create policy "authenticated_hierarchy_access" on public.portfolio_photos for all to authenticated
  using (public.can_manage_provider(provider_id)) with check (public.can_manage_provider(provider_id));

drop policy if exists "anon_full_access" on public.bookings;
create policy "anon_full_access" on public.bookings for all to anon using (true) with check (true);
drop policy if exists "authenticated_scoped_access" on public.bookings;
create policy "authenticated_hierarchy_access" on public.bookings for all to authenticated
  using (public.can_manage_provider(provider_id)) with check (public.can_manage_provider(provider_id));

drop policy if exists "anon_full_access" on public.blocked_slots;
create policy "anon_full_access" on public.blocked_slots for all to anon using (true) with check (true);
drop policy if exists "authenticated_scoped_access" on public.blocked_slots;
create policy "authenticated_hierarchy_access" on public.blocked_slots for all to authenticated
  using (public.can_manage_provider(provider_id)) with check (public.can_manage_provider(provider_id));

drop policy if exists "anon_full_access" on public.provider_clients;
create policy "anon_full_access" on public.provider_clients for all to anon using (true) with check (true);
drop policy if exists "authenticated_scoped_access" on public.provider_clients;
create policy "authenticated_hierarchy_access" on public.provider_clients for all to authenticated
  using (public.can_manage_provider(provider_id)) with check (public.can_manage_provider(provider_id));

drop policy if exists "anon_full_access" on public.clients;
create policy "anon_full_access" on public.clients for all to anon using (true) with check (true);
drop policy if exists "authenticated_scoped_access" on public.clients;
create policy "authenticated_hierarchy_access" on public.clients for all to authenticated
  using (
    public.is_master_admin()
    or exists (
      select 1 from public.client_accounts ca where ca.client_id = clients.id and ca.user_id = auth.uid()
    )
    or exists (
      select 1 from public.provider_clients pc
      where pc.client_id = clients.id and public.can_manage_provider(pc.provider_id)
    )
  )
  with check (
    public.is_master_admin()
    or exists (
      select 1 from public.client_accounts ca where ca.client_id = clients.id and ca.user_id = auth.uid()
    )
    or exists (
      select 1 from public.provider_clients pc
      where pc.client_id = clients.id and public.can_manage_provider(pc.provider_id)
    )
  );

drop policy if exists "anon_full_access" on public.client_invites;
create policy "anon_full_access" on public.client_invites for all to anon using (true) with check (true);
drop policy if exists "authenticated_scoped_access" on public.client_invites;
create policy "authenticated_hierarchy_access" on public.client_invites for all to authenticated
  using (public.can_manage_provider(provider_id)) with check (public.can_manage_provider(provider_id));

drop policy if exists "anon_full_access" on public.provider_invites;
create policy "anon_full_access" on public.provider_invites for all to anon using (true) with check (true);
drop policy if exists "authenticated_scoped_access" on public.provider_invites;
create policy "authenticated_hierarchy_access" on public.provider_invites for select to authenticated
  using (public.is_master_admin() or representative_user_id = auth.uid());

revoke all on function public.create_scoped_provider_invite(text) from public, anon;
revoke all on function public.transfer_provider_representative(text, uuid) from public, anon;
revoke all on function public.link_provider_account(text, uuid) from public, anon;
grant execute on function public.create_scoped_provider_invite(text) to authenticated;
grant execute on function public.transfer_provider_representative(text, uuid) to authenticated;
grant execute on function public.link_provider_account(text, uuid) to authenticated;
grant execute on function public.can_manage_provider(text) to authenticated;
grant select on public.provider_accounts, public.client_accounts to authenticated;
