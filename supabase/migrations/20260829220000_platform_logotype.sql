-- Logo (ícone compacto, usado no badge do sidebar/favicon) e Logotipo
-- (marca completa, usada em espaços maiores como a tela de login) são
-- imagens separadas — nem toda marca funciona igual nos dois formatos.
alter table public.platform_settings
  add column if not exists brand_logotype_url text not null default '';
