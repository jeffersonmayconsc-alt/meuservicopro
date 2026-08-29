create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null references public.providers (id) on delete cascade,
  service_id text references public.provider_services (id) on delete set null,
  event_type text not null check (event_type in ('visualizou_servico', 'iniciou_agendamento', 'agendamento_concluido')),
  visitor_id text not null,
  source text not null default 'direto',
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_provider_created_idx on public.analytics_events (provider_id, created_at desc);
create index if not exists analytics_events_service_created_idx on public.analytics_events (service_id, created_at desc);
create index if not exists analytics_events_funnel_idx on public.analytics_events (provider_id, event_type, created_at desc);

alter table public.analytics_events enable row level security;

drop policy if exists "analytics_homologation_access" on public.analytics_events;
create policy "analytics_homologation_access" on public.analytics_events
  for all to anon, authenticated using (true) with check (true);

grant select, insert on public.analytics_events to anon, authenticated;
