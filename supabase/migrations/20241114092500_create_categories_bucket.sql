/*
Bucket requerido por:
- app/admin/categories/page.tsx → MediaPicker usa bucket="categories" para imagens dos cards.
- app/api/admin/upload/constants.ts → ALLOWED_BUCKETS lista 'categories'.
*/

-- -------------------------------
-- 1. Bucket definition
-- -------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'categories',
  'categories',
  true,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- -------------------------------
-- 2. Policies dedicated to category media
-- -------------------------------
drop policy if exists "Public read category images" on storage.objects;
create policy "Public read category images"
  on storage.objects
  for select
  using (bucket_id = 'categories');

drop policy if exists "Editors insert category images" on storage.objects;
create policy "Editors insert category images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'categories'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Editors update category images" on storage.objects;
create policy "Editors update category images"
  on storage.objects
  for update
  using (
    bucket_id = 'categories'
    and auth.role() = 'authenticated'
  )
  with check (
    bucket_id = 'categories'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Editors delete category images" on storage.objects;
create policy "Editors delete category images"
  on storage.objects
  for delete
  using (
    bucket_id = 'categories'
    and auth.role() = 'authenticated'
  );
