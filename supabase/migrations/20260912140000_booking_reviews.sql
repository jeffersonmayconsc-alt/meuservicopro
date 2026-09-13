create table if not exists public.booking_reviews (
  id text primary key,
  provider_id text not null references public.providers (id) on delete cascade,
  booking_id text references public.bookings (id) on delete set null,
  client_name text not null,
  contact text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'rejeitado')),
  created_at timestamptz not null default now()
);

create index if not exists booking_reviews_provider_id_idx on public.booking_reviews (provider_id);
create index if not exists booking_reviews_status_idx on public.booking_reviews (status);

alter table public.booking_reviews enable row level security;

drop policy if exists "anon_insert_reviews" on public.booking_reviews;
create policy "anon_insert_reviews" on public.booking_reviews for insert to anon with check (true);

drop policy if exists "anon_read_approved_reviews" on public.booking_reviews;
create policy "anon_read_approved_reviews" on public.booking_reviews for select to anon using (status = 'aprovado');

drop policy if exists "authenticated_hierarchy_access" on public.booking_reviews;
create policy "authenticated_hierarchy_access" on public.booking_reviews for all to authenticated
  using (public.can_manage_provider(provider_id))
  with check (public.can_manage_provider(provider_id));

grant select, insert, update, delete on public.booking_reviews to anon, authenticated;
