alter table public.platform_settings
  add column if not exists invite_email_enabled boolean not null default false,
  add column if not exists invite_sender_name text not null default 'Meu Serviço Online',
  add column if not exists invite_sender_email text not null default '',
  add column if not exists invite_reply_to_email text not null default '';
