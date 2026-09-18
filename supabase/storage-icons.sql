insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalog-icons',
  'catalog-icons',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "catalog icons read" on storage.objects;
create policy "catalog icons read"
on storage.objects for select
using (bucket_id = 'catalog-icons');

drop policy if exists "catalog icons insert" on storage.objects;
create policy "catalog icons insert"
on storage.objects for insert
with check (bucket_id = 'catalog-icons');

drop policy if exists "catalog icons update" on storage.objects;
create policy "catalog icons update"
on storage.objects for update
using (bucket_id = 'catalog-icons')
with check (bucket_id = 'catalog-icons');
