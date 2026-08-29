alter table public.providers
  add column if not exists owner_user_id uuid references auth.users (id) on delete set null;

create unique index if not exists providers_owner_user_id_idx
  on public.providers (owner_user_id)
  where owner_user_id is not null;

create or replace function public.representative_manages_provider(target_provider_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.providers p
    join public.platform_representatives r
      on r.user_id = p.representative_user_id
    where p.id = target_provider_id
      and r.user_id = auth.uid()
      and r.status = 'ativo'
  );
$$;

create or replace function public.link_provider_owner(target_provider_id text, owner_email text)
returns uuid
language plpgsql security definer set search_path = public, auth
as $$
declare found_user_id uuid;
begin
  if not public.is_master_admin() and not public.representative_manages_provider(target_provider_id) then
    raise exception 'Sem permissão para vincular este prestador.';
  end if;

  select id into found_user_id
  from auth.users
  where lower(email) = lower(trim(owner_email))
  limit 1;

  if found_user_id is null then
    raise exception 'Nenhuma conta encontrada com esse e-mail.';
  end if;

  update public.providers
  set owner_user_id = found_user_id
  where id = target_provider_id;

  insert into public.provider_accounts (user_id, provider_id)
  values (found_user_id, target_provider_id)
  on conflict (user_id) do update set provider_id = excluded.provider_id;

  return found_user_id;
end;
$$;

revoke all on function public.link_provider_owner(text, text) from public, anon;
grant execute on function public.link_provider_owner(text, text) to authenticated;
