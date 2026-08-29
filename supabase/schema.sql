-- ============================================================
-- Meu Serviço Online — schema Supabase (migração de dados, sem autenticação real)
--
-- AVISO DE SEGURANÇA: RLS está habilitado em todas as tabelas abaixo
-- com uma política permissiva liberando leitura/escrita total para o
-- papel `anon`. Isso é INTENCIONAL nesta fase: o app ainda não tem
-- autenticação real (o login é só um seletor de papel, sem senha),
-- então não existe sessão pra restringir as políticas. Na prática,
-- qualquer pessoa com a chave anon (que já vai embutida no bundle do
-- cliente por design do Supabase) consegue ler/escrever TODAS as
-- linhas de TODAS as tabelas, incluindo nome e contato de clientes.
-- Aceitável só porque este app segue em fase de homologação, sem
-- dados reais de clientes. Precisa ser revisto antes de qualquer uso
-- com dados reais. Ver README.md.
-- ============================================================

create table public.platform_settings (
  id integer primary key default 1 check (id = 1),
  brand_name text not null default 'Meu Serviço Online',
  brand_accent text not null default '#2563eb',
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
  platform_fee_percent numeric(5,2) not null default 0
);

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
  logo_url text not null default '',
  theme jsonb not null default '{"accent":"#2563eb","background":"#111827","style":"profissional"}'::jsonb,
  duration integer not null default 50,
  price numeric(10,2) not null default 0,
  highlights text[] not null default '{}',
  active boolean not null default true,
  approval_status text not null default 'analise' check (approval_status in ('analise', 'aprovado', 'pausado')),
  capacity integer not null default 6,
  slug text not null unique,
  created_at timestamptz not null default now()
);
create index providers_active_idx on public.providers (active);

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
  created_at timestamptz not null default now()
);
create index bookings_provider_id_idx on public.bookings (provider_id);
create index bookings_provider_date_idx on public.bookings (provider_id, date);

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
  created_at timestamptz not null default now()
);
create index blocked_slots_provider_id_idx on public.blocked_slots (provider_id);
create index blocked_slots_provider_date_idx on public.blocked_slots (provider_id, date);

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

-- RLS: aberto para anon (sem autenticação real nessa fase — ver aviso no topo do arquivo)
alter table public.platform_settings enable row level security;
alter table public.providers enable row level security;
alter table public.provider_services enable row level security;
alter table public.portfolio_photos enable row level security;
alter table public.bookings enable row level security;
alter table public.clients enable row level security;
alter table public.provider_clients enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.privacy_requests enable row level security;
alter table public.provider_invites enable row level security;
alter table public.client_invites enable row level security;

create policy "anon_full_access" on public.platform_settings for all to anon, authenticated using (true) with check (true);
create policy "anon_full_access" on public.providers        for all to anon, authenticated using (true) with check (true);
create policy "anon_full_access" on public.provider_services for all to anon, authenticated using (true) with check (true);
create policy "anon_full_access" on public.portfolio_photos  for all to anon, authenticated using (true) with check (true);
create policy "anon_full_access" on public.bookings          for all to anon, authenticated using (true) with check (true);
create policy "anon_full_access" on public.clients           for all to anon, authenticated using (true) with check (true);
create policy "anon_full_access" on public.provider_clients  for all to anon, authenticated using (true) with check (true);
create policy "anon_full_access" on public.blocked_slots     for all to anon, authenticated using (true) with check (true);
create policy "anon_full_access" on public.privacy_requests  for all to anon, authenticated using (true) with check (true);
create policy "anon_full_access" on public.provider_invites  for all to anon, authenticated using (true) with check (true);
create policy "anon_full_access" on public.client_invites    for all to anon, authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
