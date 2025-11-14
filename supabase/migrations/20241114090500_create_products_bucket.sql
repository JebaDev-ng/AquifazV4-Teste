/*
Bucket requerido por:
- components/admin/products/product-form.tsx → MediaPicker usa bucket="products" e prefixo products/<productId> para imagem principal e galeria.
- app/api/admin/upload/constants.ts → lista FEATURE_BUCKETS inclui 'products'.
- app/api/admin/upload/route.ts → valida bucket enviado e grava objetos na storage.
*/

-- -------------------------------
-- 1. Bucket definition
-- -------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'products',
  'products',
  true,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- -------------------------------
-- 2. Metadata comments (safe guards)
-- -------------------------------
do $$
begin
  comment on table storage.buckets is 'Armazena a configuração dos buckets usados pelo Supabase Storage.';
exception when insufficient_privilege then
  raise notice 'Skipping table comment on storage.buckets: %', SQLERRM;
end;
$$;

do $$
begin
  comment on column storage.buckets.allowed_mime_types is 'Lista de tipos aceitos para uploads no bucket. Alinhado à API de upload.';
exception when insufficient_privilege then
  raise notice 'Skipping column comment on storage.buckets.allowed_mime_types: %', SQLERRM;
end;
$$;

-- -------------------------------
-- 3. Storage policies
-- -------------------------------
-- Policies para objetos do bucket "products"
drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects
  for select
  using (bucket_id = 'products');

drop policy if exists "Editors insert product images" on storage.objects;
create policy "Editors insert product images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'products'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Editors update product images" on storage.objects;
create policy "Editors update product images"
  on storage.objects
  for update
  using (
    bucket_id = 'products'
    and auth.role() = 'authenticated'
  )
  with check (
    bucket_id = 'products'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Editors delete product images" on storage.objects;
create policy "Editors delete product images"
  on storage.objects
  for delete
  using (
    bucket_id = 'products'
    and auth.role() = 'authenticated'
  );
