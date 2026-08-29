-- Comunicados internos do admin master pros prestadores (e representantes),
-- exibidos como banner no painel deles. Não é visível pro cliente público
-- (fluxo anon nem consulta essa tabela).
create table if not exists public.platform_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists platform_announcements_active_idx on public.platform_announcements (active);

alter table public.platform_announcements enable row level security;

drop policy if exists "authenticated_read_active_announcements" on public.platform_announcements;
create policy "authenticated_read_active_announcements" on public.platform_announcements for select to authenticated
  using (active or public.is_master_admin());

drop policy if exists "master_manage_announcements" on public.platform_announcements;
create policy "master_manage_announcements" on public.platform_announcements for all to authenticated
  using (public.is_master_admin()) with check (public.is_master_admin());

grant select, insert, update, delete on public.platform_announcements to authenticated;
