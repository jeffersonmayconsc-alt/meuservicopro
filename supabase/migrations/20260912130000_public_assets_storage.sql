insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-assets',
  'public-assets',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public_read_public_assets" on storage.objects;
create policy "public_read_public_assets" on storage.objects for select
  using (bucket_id = 'public-assets');

drop policy if exists "authenticated_write_public_assets" on storage.objects;
create policy "authenticated_write_public_assets" on storage.objects for insert to authenticated
  with check (bucket_id = 'public-assets');

drop policy if exists "authenticated_update_public_assets" on storage.objects;
create policy "authenticated_update_public_assets" on storage.objects for update to authenticated
  using (bucket_id = 'public-assets')
  with check (bucket_id = 'public-assets');

drop policy if exists "authenticated_delete_public_assets" on storage.objects;
create policy "authenticated_delete_public_assets" on storage.objects for delete to authenticated
  using (bucket_id = 'public-assets');
