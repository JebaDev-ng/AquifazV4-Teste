-- Migration: Create the product_categories table and its supporting structure.
-- Sections: 1) Table definition, 2) Comments, 3) Indexes, 4) Row Level Security.

-- -------------------------------
-- 1. Table definition
-- -------------------------------
create table if not exists public.product_categories (
  id text primary key
    constraint product_categories_slug_format check (id ~ '^[a-z0-9-]{2,50}$'),
  name text not null
    constraint product_categories_name_not_empty check (char_length(btrim(name)) >= 2),
  description text,
  accent_color text constraint product_categories_accent_color_format check (
    accent_color is null or accent_color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  image_url text,
  storage_path text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

-- -------------------------------
-- 2. Comments
-- -------------------------------
comment on table public.product_categories is 'Categorias exibidas no admin e na homepage.';
comment on column public.product_categories.accent_color is 'Cor de destaque exibida nos cards e filtros.';
comment on column public.product_categories.image_url is 'URL pública usada nos cards da vitrine.';
comment on column public.product_categories.storage_path is 'Storage path associado, usado pelo MediaPicker.';

-- -------------------------------
-- 3. Indexes
-- -------------------------------
create index if not exists product_categories_active_idx
  on public.product_categories (active);

create index if not exists product_categories_sort_order_idx
  on public.product_categories (sort_order, name);

create index if not exists product_categories_updated_at_idx
  on public.product_categories (updated_at desc);

-- -------------------------------
-- 4. Row Level Security
-- -------------------------------
alter table public.product_categories enable row level security;

drop policy if exists "Public read active product categories" on public.product_categories;
create policy "Public read active product categories"
  on public.product_categories
  for select
  using (active = true);

drop policy if exists "Editors read product categories" on public.product_categories;
create policy "Editors read product categories"
  on public.product_categories
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "Editors insert product categories" on public.product_categories;
create policy "Editors insert product categories"
  on public.product_categories
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Editors update product categories" on public.product_categories;
create policy "Editors update product categories"
  on public.product_categories
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Editors delete product categories" on public.product_categories;
create policy "Editors delete product categories"
  on public.product_categories
  for delete
  using (auth.role() = 'authenticated');
