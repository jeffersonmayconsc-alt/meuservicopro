alter table public.portfolio_photos
  add column if not exists kind text not null default 'foto' check (kind in ('foto', 'banner'));
