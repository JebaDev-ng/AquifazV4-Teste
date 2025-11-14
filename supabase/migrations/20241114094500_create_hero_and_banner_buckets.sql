/*
Buckets requeridos por:
- app/admin/content/hero/page.tsx → MediaPicker usa bucket="hero".
- app/admin/content/banners/page.tsx → MediaPicker usa bucket="banners".
- app/api/admin/upload/constants.ts → ALLOWED_BUCKETS inclui 'hero' e 'banners'.
*/

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'hero',
    'hero',
    true,
    5 * 1024 * 1024,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  ),
  (
    'banners',
    'banners',
    true,
    8 * 1024 * 1024,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  )
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Policies for hero images
drop policy if exists "Public read hero images" on storage.objects;
create policy "Public read hero images"
  on storage.objects
  for select
  using (bucket_id = 'hero');

drop policy if exists "Editors insert hero images" on storage.objects;
create policy "Editors insert hero images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'hero'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Editors update hero images" on storage.objects;
create policy "Editors update hero images"
  on storage.objects
  for update
  using (
    bucket_id = 'hero'
    and auth.role() = 'authenticated'
  )
  with check (
    bucket_id = 'hero'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Editors delete hero images" on storage.objects;
create policy "Editors delete hero images"
  on storage.objects
  for delete
  using (
    bucket_id = 'hero'
    and auth.role() = 'authenticated'
  );

-- Policies for banner images
drop policy if exists "Public read banner images" on storage.objects;
create policy "Public read banner images"
  on storage.objects
  for select
  using (bucket_id = 'banners');

drop policy if exists "Editors insert banner images" on storage.objects;
create policy "Editors insert banner images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'banners'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Editors update banner images" on storage.objects;
create policy "Editors update banner images"
  on storage.objects
  for update
  using (
    bucket_id = 'banners'
    and auth.role() = 'authenticated'
  )
  with check (
    bucket_id = 'banners'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Editors delete banner images" on storage.objects;
create policy "Editors delete banner images"
  on storage.objects
  for delete
  using (
    bucket_id = 'banners'
    and auth.role() = 'authenticated'
  );
