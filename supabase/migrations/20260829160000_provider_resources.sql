-- Recursos (profissionais/salas/cadeiras) dentro de uma mesma loja.
-- Opcional por padrão: um prestador que nunca cadastra um recurso continua
-- com 1 agenda só, exatamente como sempre foi (bookings/blocked_slots.resource_id
-- fica null e o cálculo de disponibilidade permanece por prestador). Só quando
-- o prestador cadastra pelo menos 1 recurso é que o agendamento passa a exigir
-- escolher um recurso específico e a disponibilidade passa a ser calculada por
-- recurso, não mais pela loja inteira.

create table if not exists public.provider_resources (
  id text primary key,
  provider_id text not null references public.providers (id) on delete cascade,
  name text not null,
  bio text not null default '',
  photo_url text not null default '',
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists provider_resources_provider_id_idx on public.provider_resources (provider_id);
create index if not exists provider_resources_provider_active_idx on public.provider_resources (provider_id, active);

alter table public.bookings add column if not exists resource_id text references public.provider_resources (id) on delete set null;
alter table public.blocked_slots add column if not exists resource_id text references public.provider_resources (id) on delete set null;

create index if not exists bookings_resource_id_idx on public.bookings (resource_id);
create index if not exists blocked_slots_resource_id_idx on public.blocked_slots (resource_id);

alter table public.provider_resources enable row level security;

drop policy if exists "anon_full_access" on public.provider_resources;
create policy "anon_full_access" on public.provider_resources for all to anon using (true) with check (true);
create policy "authenticated_scoped_access" on public.provider_resources for all to authenticated
  using (public.is_master_admin() or public.owns_provider(provider_id))
  with check (public.is_master_admin() or public.owns_provider(provider_id));

grant select, insert, update, delete on public.provider_resources to anon, authenticated;
