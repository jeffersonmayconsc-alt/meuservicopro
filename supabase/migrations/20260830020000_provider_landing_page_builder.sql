alter table public.providers
  add column if not exists landing_subtitle text not null default '',
  add column if not exists cta_label text not null default 'Agendar agora',
  add column if not exists proof_title text not null default '',
  add column if not exists proof_items text[] not null default '{}',
  add column if not exists faq_items jsonb not null default '[]'::jsonb,
  add column if not exists contact_channels jsonb not null default '{}'::jsonb,
  add column if not exists trust_badges text[] not null default '{}';
