create table if not exists public.provider_invites (
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

create index if not exists provider_invites_status_idx on public.provider_invites (status);

create table if not exists public.client_invites (
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

create index if not exists client_invites_provider_id_idx on public.client_invites (provider_id);
create index if not exists client_invites_status_idx on public.client_invites (status);

alter table public.provider_invites enable row level security;
alter table public.client_invites enable row level security;

drop policy if exists "anon_full_access" on public.provider_invites;
drop policy if exists "anon_full_access" on public.client_invites;

create policy "anon_full_access" on public.provider_invites for all to anon, authenticated using (true) with check (true);
create policy "anon_full_access" on public.client_invites for all to anon, authenticated using (true) with check (true);

grant select, insert, update, delete on public.provider_invites to anon, authenticated;
grant select, insert, update, delete on public.client_invites to anon, authenticated;
