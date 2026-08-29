alter table public.platform_settings
  add column if not exists brand_logotype_size integer not null default 64
  check (brand_logotype_size between 44 and 96);
