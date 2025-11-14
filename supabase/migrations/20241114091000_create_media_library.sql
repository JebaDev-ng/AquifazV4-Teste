create extension if not exists "pgcrypto";

-- -------------------------------
-- 1. Table definition
-- -------------------------------
create table if not exists public.media_library (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media',
  filename text not null,
  original_name text not null,
  url text not null,
  storage_path text not null,
  checksum text,
  size integer not null check (size >= 0),
  mime_type text not null,
  width integer check (width >= 0),
  height integer check (height >= 0),
  alt_text text,
  category text,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

-- -------------------------------
-- 2. Comments
-- -------------------------------
comment on table public.media_library is 'Registra os metadados de uploads processados pelo painel admin.';
comment on column public.media_library.bucket is 'Bucket onde o arquivo foi armazenado.';
comment on column public.media_library.checksum is 'Hash SHA-256 usado para detectar duplicatas e reutilizar uploads.';
comment on column public.media_library.storage_path is 'Caminho completo do objeto dentro do bucket.';

-- -------------------------------
-- 3. Indexes
-- -------------------------------
create unique index if not exists media_library_checksum_unique
  on public.media_library (bucket, checksum)
  where checksum is not null;

create index if not exists media_library_bucket_idx
  on public.media_library (bucket);

create index if not exists media_library_created_at_idx
  on public.media_library (created_at);

-- -------------------------------
-- 4. Row Level Security
-- -------------------------------
alter table public.media_library enable row level security;

drop policy if exists "Authenticated read media library" on public.media_library;
create policy "Authenticated read media library"
  on public.media_library
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "Editors insert media library" on public.media_library;
create policy "Editors insert media library"
  on public.media_library
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Editors update media library" on public.media_library;
create policy "Editors update media library"
  on public.media_library
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Editors delete media library" on public.media_library;
create policy "Editors delete media library"
  on public.media_library
  for delete
  using (auth.role() = 'authenticated');
