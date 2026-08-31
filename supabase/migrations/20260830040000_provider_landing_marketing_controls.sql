alter table public.providers
  add column if not exists terms_text text not null default '',
  add column if not exists neighborhood text not null default '',
  add column if not exists address text not null default '',
  add column if not exists service_mode text not null default 'presencial_online',
  add column if not exists hero_banner_url text not null default '',
  add column if not exists gallery_photos jsonb not null default '[]'::jsonb,
  add column if not exists testimonials jsonb not null default '[]'::jsonb,
  add column if not exists seo_title text not null default '',
  add column if not exists seo_description text not null default '',
  add column if not exists meta_pixel_id text not null default '',
  add column if not exists google_tag_id text not null default '',
  add column if not exists thank_you_title text not null default 'Solicitacao recebida',
  add column if not exists thank_you_message text not null default 'Recebemos seu pedido de agendamento. O prestador vai confirmar os detalhes pelo contato informado.',
  add column if not exists landing_status text not null default 'publicado'
    check (landing_status in ('rascunho', 'publicado'));
