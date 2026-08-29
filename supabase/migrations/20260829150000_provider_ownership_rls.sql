-- Vincula prestadores a uma conta real do Supabase Auth e restringe o
-- que uma conta autenticada (não-admin) pode ler/escrever pela RLS ao
-- que pertence ao seu próprio prestador. O acesso anônimo (`anon`) usado
-- pelo fluxo público de agendamento do cliente NÃO muda — continua
-- aberto como já era, porque o cliente nunca se autentica.

alter table public.providers
  add column if not exists owner_user_id uuid references auth.users (id) on delete set null;

create unique index if not exists providers_owner_user_id_idx
  on public.providers (owner_user_id)
  where owner_user_id is not null;

-- Helpers reutilizados por todas as políticas abaixo.
create or replace function public.is_master_admin()
returns boolean
language sql stable security definer set search_path = public, auth
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'jeffersonmaycon.sc@gmail.com';
$$;

create or replace function public.owns_provider(target_provider_id text)
returns boolean
language sql stable security definer set search_path = public, auth
as $$
  select exists (
    select 1 from public.providers p
    where p.id = target_provider_id and p.owner_user_id = auth.uid()
  );
$$;

revoke all on function public.is_master_admin() from public, anon;
grant execute on function public.is_master_admin() to authenticated;
revoke all on function public.owns_provider(text) from public, anon;
grant execute on function public.owns_provider(text) to authenticated;

-- RPC pro admin vincular um prestador existente a uma conta que já fez
-- "Criar primeiro acesso"/login (o app não consegue consultar auth.users
-- direto pela anon key, por isso passa pela função com security definer).
create or replace function public.admin_link_provider_owner(target_provider_id text, owner_email text)
returns void
language plpgsql security definer set search_path = public, auth
as $$
declare
  found_user_id uuid;
begin
  if not public.is_master_admin() then
    raise exception 'Somente o admin master pode vincular o dono de um prestador.';
  end if;

  select id into found_user_id from auth.users where lower(email) = lower(owner_email) limit 1;

  if found_user_id is null then
    raise exception 'Nenhuma conta encontrada com esse e-mail. A pessoa precisa fazer login pelo menos uma vez antes de ser vinculada.';
  end if;

  update public.providers set owner_user_id = found_user_id where id = target_provider_id;
end;
$$;

revoke all on function public.admin_link_provider_owner(text, text) from public, anon;
grant execute on function public.admin_link_provider_owner(text, text) to authenticated;

-- Substitui a política única "anon_full_access" por um par anon/authenticated
-- em cada tabela de negócio: anon continua liberado (fluxo público do
-- cliente), authenticated passa a ser admin-master-ou-dono-do-prestador.

drop policy if exists "anon_full_access" on public.providers;
create policy "anon_full_access" on public.providers for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.providers for all to authenticated
  using (public.is_master_admin() or owner_user_id = auth.uid())
  with check (public.is_master_admin() or owner_user_id = auth.uid());

drop policy if exists "anon_full_access" on public.provider_services;
create policy "anon_full_access" on public.provider_services for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.provider_services for all to authenticated
  using (public.is_master_admin() or public.owns_provider(provider_id))
  with check (public.is_master_admin() or public.owns_provider(provider_id));

drop policy if exists "anon_full_access" on public.portfolio_photos;
create policy "anon_full_access" on public.portfolio_photos for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.portfolio_photos for all to authenticated
  using (public.is_master_admin() or public.owns_provider(provider_id))
  with check (public.is_master_admin() or public.owns_provider(provider_id));

drop policy if exists "anon_full_access" on public.bookings;
create policy "anon_full_access" on public.bookings for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.bookings for all to authenticated
  using (public.is_master_admin() or public.owns_provider(provider_id))
  with check (public.is_master_admin() or public.owns_provider(provider_id));

drop policy if exists "anon_full_access" on public.blocked_slots;
create policy "anon_full_access" on public.blocked_slots for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.blocked_slots for all to authenticated
  using (public.is_master_admin() or public.owns_provider(provider_id))
  with check (public.is_master_admin() or public.owns_provider(provider_id));

drop policy if exists "anon_full_access" on public.provider_clients;
create policy "anon_full_access" on public.provider_clients for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.provider_clients for all to authenticated
  using (public.is_master_admin() or public.owns_provider(provider_id))
  with check (public.is_master_admin() or public.owns_provider(provider_id));

drop policy if exists "anon_full_access" on public.clients;
create policy "anon_full_access" on public.clients for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.clients for all to authenticated
  using (
    public.is_master_admin()
    or exists (
      select 1 from public.provider_clients pc
      where pc.client_id = clients.id and public.owns_provider(pc.provider_id)
    )
  )
  with check (
    public.is_master_admin()
    or exists (
      select 1 from public.provider_clients pc
      where pc.client_id = clients.id and public.owns_provider(pc.provider_id)
    )
  );

drop policy if exists "anon_full_access" on public.privacy_requests;
create policy "anon_full_access" on public.privacy_requests for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.privacy_requests for all to authenticated
  using (public.is_master_admin() or (provider_id is not null and public.owns_provider(provider_id)))
  with check (public.is_master_admin() or (provider_id is not null and public.owns_provider(provider_id)));

drop policy if exists "anon_full_access" on public.client_invites;
create policy "anon_full_access" on public.client_invites for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.client_invites for all to authenticated
  using (public.is_master_admin() or public.owns_provider(provider_id))
  with check (public.is_master_admin() or public.owns_provider(provider_id));

-- Convite de prestador e configurações da plataforma são só do admin.
drop policy if exists "anon_full_access" on public.provider_invites;
create policy "anon_full_access" on public.provider_invites for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.provider_invites for all to authenticated
  using (public.is_master_admin())
  with check (public.is_master_admin());

drop policy if exists "anon_full_access" on public.platform_settings;
create policy "anon_full_access" on public.platform_settings for select to anon using (true);
create policy "authenticated_scoped_access" on public.platform_settings for all to authenticated
  using (public.is_master_admin())
  with check (public.is_master_admin());

drop policy if exists "analytics_homologation_access" on public.analytics_events;
create policy "anon_full_access" on public.analytics_events for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.analytics_events for all to authenticated
  using (public.is_master_admin() or public.owns_provider(provider_id))
  with check (public.is_master_admin() or public.owns_provider(provider_id));
