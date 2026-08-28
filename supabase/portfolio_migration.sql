-- ============================================================
-- Agenda Flex - migracao compativel para catalogo/portfolio
--
-- Use em bancos ja criados com a versao anterior do schema.
-- Mantem providers.service/duration/price porque o App.jsx atual
-- ainda depende desses campos.
-- ============================================================

alter table public.providers
  add column if not exists highlights text[] not null default '{}';

create table if not exists public.provider_services (
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

create index if not exists provider_services_provider_id_idx
  on public.provider_services (provider_id);

create index if not exists provider_services_provider_active_idx
  on public.provider_services (provider_id, active);

create table if not exists public.portfolio_photos (
  id text primary key,
  provider_id text not null references public.providers (id) on delete cascade,
  service_id text references public.provider_services (id) on delete set null,
  image_base64 text not null,
  caption text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists portfolio_photos_provider_id_idx
  on public.portfolio_photos (provider_id);

create index if not exists portfolio_photos_service_id_idx
  on public.portfolio_photos (service_id);

alter table public.bookings
  add column if not exists service_id text references public.provider_services (id) on delete set null;

insert into public.provider_services (id, provider_id, name, description, price, price_mode, duration, active, position)
select
  'legacy-' || providers.id,
  providers.id,
  providers.service,
  providers.first_offer,
  providers.price,
  'fixo',
  providers.duration,
  true,
  0
from public.providers
where not exists (
  select 1
  from public.provider_services
  where provider_services.provider_id = providers.id
);

alter table public.provider_services enable row level security;
alter table public.portfolio_photos enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'provider_services'
      and policyname = 'anon_full_access'
  ) then
    create policy "anon_full_access" on public.provider_services for all to anon, authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'portfolio_photos'
      and policyname = 'anon_full_access'
  ) then
    create policy "anon_full_access" on public.portfolio_photos for all to anon, authenticated using (true) with check (true);
  end if;
end $$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
