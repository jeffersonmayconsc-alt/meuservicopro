alter table public.platform_settings
  add column if not exists brand_logo_url text not null default '';
