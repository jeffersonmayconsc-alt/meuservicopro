drop policy if exists "authenticated_scoped_access" on public.provider_resources;
drop policy if exists "authenticated_hierarchy_access" on public.provider_resources;

create policy "authenticated_hierarchy_access" on public.provider_resources for all to authenticated
  using (public.can_manage_provider(provider_id))
  with check (public.can_manage_provider(provider_id));
