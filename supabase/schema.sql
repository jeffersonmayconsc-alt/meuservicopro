-- ============================================================
-- Meu Serviço Online — schema Supabase
--
-- AVISO DE SEGURANÇA (revisado 2026-08-29, ver guia_claudinha.md §4.1):
-- o papel `anon` continua com política permissiva liberando leitura/escrita
-- total — INTENCIONAL, é o que sustenta o fluxo público do cliente, que
-- nunca se autentica. Na prática, qualquer pessoa com a chave anon (que já
-- vai embutida no bundle do cliente por design do Supabase) consegue
-- ler/escrever TODAS as linhas de TODAS as tabelas, incluindo nome e
-- contato de clientes. Aceitável só porque este app segue em fase de
-- homologação, sem dados reais de clientes.
-- O papel `authenticated` JÁ NÃO é mais aberto: desde a migração
-- 20260829150000_provider_ownership_rls.sql, admin master
-- (is_master_admin()) tem acesso total e um prestador autenticado só
-- lê/escreve o que pertence ao provider_id que ele é dono
-- (owns_provider(), via providers.owner_user_id). Ver README.md.
-- ============================================================

create table public.platform_settings (
  id integer primary key default 1 check (id = 1),
  brand_name text not null default 'Meu Serviço Online',
  brand_accent text not null default '#2563eb',
  brand_logo_url text not null default '',
  brand_logotype_url text not null default '',
  brand_support text not null default 'contato@meuservicopro.local',
  brand_privacy_email text not null default 'privacidade@meuservicopro.local',
  approval_mode text not null default 'manual' check (approval_mode in ('manual', 'automatico')),
  min_lead_hours integer not null default 2,
  max_advance_days integer not null default 30,
  return_alert_days integer not null default 30,
  inactive_alert_days integer not null default 60,
  cancellation_window_hours integer not null default 12,
  default_slot_interval integer not null default 60,
  require_consent boolean not null default true,
  allow_client_privacy_request boolean not null default true,
  allow_provider_self_signup boolean not null default false,
  allow_whatsapp_share boolean not null default true,
  platform_fee_percent numeric(5,2) not null default 0,
  min_password_length integer not null default 8 check (min_password_length between 8 and 64)
);

-- Status de segurança de conta (auth.users) pro admin master ver claramente
-- quem ainda não trocou a senha temporária ou nunca acessou o sistema.
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

create table public.providers (
  id text primary key,
  name text not null,
  owner text not null,
  category text not null,
  city text not null,
  about text not null default '',
  -- Campos legados mantidos temporariamente para compatibilidade com o App.jsx atual.
  service text not null,
  invite_title text not null default '',
  invite_message text not null default '',
  first_offer text not null default '',
  landing_subtitle text not null default '',
  cta_label text not null default 'Agendar agora',
  proof_title text not null default '',
  proof_items text[] not null default '{}',
  faq_items jsonb not null default '[]'::jsonb,
  contact_channels jsonb not null default '{}'::jsonb,
  trust_badges text[] not null default '{}',
  terms_text text not null default '',
  neighborhood text not null default '',
  address text not null default '',
  service_mode text not null default 'presencial_online',
  hero_banner_url text not null default '',
  gallery_photos jsonb not null default '[]'::jsonb,
  testimonials jsonb not null default '[]'::jsonb,
  seo_title text not null default '',
  seo_description text not null default '',
  meta_pixel_id text not null default '',
  google_tag_id text not null default '',
  thank_you_title text not null default 'Solicitacao recebida',
  thank_you_message text not null default 'Recebemos seu pedido de agendamento. O prestador vai confirmar os detalhes pelo contato informado.',
  landing_status text not null default 'publicado' check (landing_status in ('rascunho', 'publicado')),
  logo_url text not null default '',
  theme jsonb not null default '{"accent":"#2563eb","background":"#111827","style":"profissional"}'::jsonb,
  duration integer not null default 50,
  price numeric(10,2) not null default 0,
  highlights text[] not null default '{}',
  active boolean not null default true,
  approval_status text not null default 'analise' check (approval_status in ('analise', 'aprovado', 'pausado')),
  capacity integer not null default 6,
  slug text not null unique,
  created_at timestamptz not null default now(),
  owner_user_id uuid references auth.users (id) on delete set null,
  show_prices boolean not null default true
);
create index providers_active_idx on public.providers (active);
create unique index providers_owner_user_id_idx on public.providers (owner_user_id) where owner_user_id is not null;

create table public.provider_resources (
  id text primary key,
  provider_id text not null references public.providers (id) on delete cascade,
  name text not null,
  bio text not null default '',
  photo_url text not null default '',
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index provider_resources_provider_id_idx on public.provider_resources (provider_id);
create index provider_resources_provider_active_idx on public.provider_resources (provider_id, active);

create table public.provider_services (
  id text primary key,
  provider_id text not null references public.providers (id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null default 0,
  price_mode text not null default 'fixo' check (price_mode in ('fixo', 'a_partir_de', 'sob_consulta')),
  duration integer,
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index provider_services_provider_id_idx on public.provider_services (provider_id);
create index provider_services_provider_active_idx on public.provider_services (provider_id, active);

create table public.portfolio_photos (
  id text primary key,
  provider_id text not null references public.providers (id) on delete cascade,
  service_id text references public.provider_services (id) on delete set null,
  image_base64 text not null,
  caption text not null default '',
  position integer not null default 0,
  kind text not null default 'foto' check (kind in ('foto', 'banner')),
  created_at timestamptz not null default now()
);
create index portfolio_photos_provider_id_idx on public.portfolio_photos (provider_id);
create index portfolio_photos_service_id_idx on public.portfolio_photos (service_id);

create table public.bookings (
  id text primary key,
  provider_id text not null references public.providers (id) on delete cascade,
  service_id text references public.provider_services (id) on delete set null,
  client text not null,
  contact text not null,
  date date not null,
  time text not null,
  status text not null default 'pendente' check (status in ('pendente', 'confirmado', 'concluido', 'cancelado')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  resource_id text references public.provider_resources (id) on delete set null,
  extra_services text not null default ''
);
create index bookings_provider_id_idx on public.bookings (provider_id);
create index bookings_provider_date_idx on public.bookings (provider_id, date);
create index bookings_resource_id_idx on public.bookings (resource_id);

create table public.clients (
  id text primary key,
  name text not null,
  contact text not null,
  consent boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.provider_clients (
  id text primary key,
  provider_id text not null references public.providers (id) on delete cascade,
  client_id text not null references public.clients (id) on delete cascade,
  consent boolean not null default false,
  consent_at timestamptz,
  consent_text text,
  created_at timestamptz not null default now()
);
create index provider_clients_provider_id_idx on public.provider_clients (provider_id);
create index provider_clients_client_id_idx on public.provider_clients (client_id);

create table public.blocked_slots (
  id text primary key,
  provider_id text not null references public.providers (id) on delete cascade,
  date date not null,
  time text not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  resource_id text references public.provider_resources (id) on delete set null
);
create index blocked_slots_provider_id_idx on public.blocked_slots (provider_id);
create index blocked_slots_provider_date_idx on public.blocked_slots (provider_id, date);
create index blocked_slots_resource_id_idx on public.blocked_slots (resource_id);

create table public.privacy_requests (
  id text primary key,
  provider_id text references public.providers (id) on delete set null,
  contact text not null,
  type text not null default 'exclusao_ou_acesso',
  status text not null default 'aberta',
  created_at timestamptz not null default now()
);
create index privacy_requests_provider_id_idx on public.privacy_requests (provider_id);

create table public.provider_invites (
  id text primary key,
  token text not null unique,
  created_by_admin text not null,
  invited_email text not null default '',
  status text not null default 'ativo' check (status in ('ativo', 'usado', 'expirado', 'cancelado')),
  expires_at timestamptz,
  used_by_provider_id text references public.providers (id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index provider_invites_status_idx on public.provider_invites (status);

create table public.client_invites (
  id text primary key,
  token text not null unique,
  provider_id text not null references public.providers (id) on delete cascade,
  created_by_provider_id text not null references public.providers (id) on delete cascade,
  invited_contact text not null default '',
  status text not null default 'ativo' check (status in ('ativo', 'usado', 'expirado', 'cancelado')),
  expires_at timestamptz,
  used_by_client_id text references public.clients (id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index client_invites_provider_id_idx on public.client_invites (provider_id);
create index client_invites_status_idx on public.client_invites (status);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null references public.providers (id) on delete cascade,
  service_id text references public.provider_services (id) on delete set null,
  event_type text not null check (event_type in ('visualizou_servico', 'iniciou_agendamento', 'agendamento_concluido')),
  visitor_id text not null,
  source text not null default 'direto',
  created_at timestamptz not null default now()
);
create index analytics_events_provider_created_idx on public.analytics_events (provider_id, created_at desc);
create index analytics_events_service_created_idx on public.analytics_events (service_id, created_at desc);
create index analytics_events_funnel_idx on public.analytics_events (provider_id, event_type, created_at desc);

-- Identidades e hierarquia de responsabilidade.
create table public.platform_representatives (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  status text not null default 'ativo' check (status in ('ativo', 'suspenso')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index platform_representatives_email_idx on public.platform_representatives (lower(email));

create table public.representative_invites (
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

create table public.provider_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  provider_id text not null unique references public.providers (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.client_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  client_id text not null unique references public.clients (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Comunicados internos do admin master pros prestadores/representantes
-- (banner no painel deles). Não é consultado pelo fluxo público anon.
create table public.platform_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index platform_announcements_active_idx on public.platform_announcements (active);

alter table public.providers add column representative_user_id uuid
  references public.platform_representatives (user_id) on delete set null;
alter table public.provider_invites
  add column created_by_user_id uuid references auth.users (id) on delete set null,
  add column representative_user_id uuid references public.platform_representatives (user_id) on delete set null;
create index providers_representative_user_id_idx on public.providers (representative_user_id);
create index provider_invites_representative_user_id_idx on public.provider_invites (representative_user_id);

-- RLS de dados (revisado 2026-08-29, ver §4.1 do guia_claudinha.md):
-- `anon` continua totalmente aberto — sustenta o fluxo público do cliente,
-- que nunca se autentica. `authenticated` deixou de ser aberto: admin master
-- (is_master_admin()) tem acesso total; um prestador autenticado só
-- lê/escreve o que pertence ao provider_id que ele é dono (owns_provider()).
alter table public.platform_settings enable row level security;
alter table public.providers enable row level security;
alter table public.provider_resources enable row level security;
alter table public.provider_services enable row level security;
alter table public.portfolio_photos enable row level security;
alter table public.bookings enable row level security;
alter table public.clients enable row level security;
alter table public.provider_clients enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.privacy_requests enable row level security;
alter table public.provider_invites enable row level security;
alter table public.client_invites enable row level security;
alter table public.analytics_events enable row level security;

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

create policy "anon_full_access" on public.platform_settings for select to anon using (true);
create policy "authenticated_scoped_access" on public.platform_settings for all to authenticated
  using (public.is_master_admin()) with check (public.is_master_admin());

create policy "anon_full_access" on public.providers for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.providers for all to authenticated
  using (public.is_master_admin() or owner_user_id = auth.uid())
  with check (public.is_master_admin() or owner_user_id = auth.uid());

create policy "anon_full_access" on public.provider_resources for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.provider_resources for all to authenticated
  using (public.is_master_admin() or public.owns_provider(provider_id))
  with check (public.is_master_admin() or public.owns_provider(provider_id));

create policy "anon_full_access" on public.provider_services for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.provider_services for all to authenticated
  using (public.is_master_admin() or public.owns_provider(provider_id))
  with check (public.is_master_admin() or public.owns_provider(provider_id));

create policy "anon_full_access" on public.portfolio_photos for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.portfolio_photos for all to authenticated
  using (public.is_master_admin() or public.owns_provider(provider_id))
  with check (public.is_master_admin() or public.owns_provider(provider_id));

create policy "anon_full_access" on public.bookings for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.bookings for all to authenticated
  using (public.is_master_admin() or public.owns_provider(provider_id))
  with check (public.is_master_admin() or public.owns_provider(provider_id));

create policy "anon_full_access" on public.blocked_slots for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.blocked_slots for all to authenticated
  using (public.is_master_admin() or public.owns_provider(provider_id))
  with check (public.is_master_admin() or public.owns_provider(provider_id));

create policy "anon_full_access" on public.provider_clients for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.provider_clients for all to authenticated
  using (public.is_master_admin() or public.owns_provider(provider_id))
  with check (public.is_master_admin() or public.owns_provider(provider_id));

create policy "anon_full_access" on public.clients for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.clients for all to authenticated
  using (
    public.is_master_admin()
    or exists (select 1 from public.provider_clients pc where pc.client_id = clients.id and public.owns_provider(pc.provider_id))
  )
  with check (
    public.is_master_admin()
    or exists (select 1 from public.provider_clients pc where pc.client_id = clients.id and public.owns_provider(pc.provider_id))
  );

create policy "anon_full_access" on public.privacy_requests for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.privacy_requests for all to authenticated
  using (public.is_master_admin() or (provider_id is not null and public.owns_provider(provider_id)))
  with check (public.is_master_admin() or (provider_id is not null and public.owns_provider(provider_id)));

create policy "anon_full_access" on public.provider_invites for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.provider_invites for all to authenticated
  using (public.is_master_admin()) with check (public.is_master_admin());

create policy "anon_full_access" on public.client_invites for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.client_invites for all to authenticated
  using (public.is_master_admin() or public.owns_provider(provider_id))
  with check (public.is_master_admin() or public.owns_provider(provider_id));

create policy "anon_full_access" on public.analytics_events for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.analytics_events for all to authenticated
  using (public.is_master_admin() or public.owns_provider(provider_id))
  with check (public.is_master_admin() or public.owns_provider(provider_id));

alter table public.platform_announcements enable row level security;
create policy "authenticated_read_active_announcements" on public.platform_announcements for select to authenticated
  using (active or public.is_master_admin());
create policy "master_manage_announcements" on public.platform_announcements for all to authenticated
  using (public.is_master_admin()) with check (public.is_master_admin());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

-- Sessões: leitura restrita ao próprio usuário autenticado.
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

create or replace function public.revoke_my_auth_sessions(target_session_ids uuid[])
returns integer
language plpgsql security definer set search_path = public, auth
as $$
declare current_session_id uuid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
declare revoked_count integer;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.'; end if;
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

alter table public.platform_settings
  add column if not exists brand_logotype_size integer not null default 64;

alter table public.platform_settings
  drop constraint if exists platform_settings_brand_logotype_size_check;

alter table public.platform_settings
  add column if not exists invite_email_enabled boolean not null default false,
  add column if not exists invite_sender_name text not null default 'Meu Serviço Online',
  add column if not exists invite_sender_email text not null default '',
  add column if not exists invite_reply_to_email text not null default '';
