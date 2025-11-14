create extension if not exists "pgcrypto";

/*
Campos do produto -> origem no codigo:
- id (app/api/admin/products/route.ts) - API aceita UUID externo.
- slug (components/admin/products/product-form.tsx) - formulario gera slug usado no front/app/produtos.
- name e description (components/admin/products/product-form.tsx) - campos principais exibidos no admin e vitrine.
- category (components/admin/products/product-form.tsx & ProductCategory em lib/types.ts) - usa o slug/id da categoria atual.
- price (components/admin/products/product-form.tsx e app/produtos/page.tsx) - valores exibidos ao usuario.
- original_price e discount_percent (product-form + ProductCard.tsx) - controle de promocoes.
- discount_price/discount_start/discount_end (app/api/admin/products/route.ts) - payload ja preve campos de agendamento.
- image_url, thumbnail_url e storage_path (product-form.tsx + lib/types.ts) - imagens lidas pelo catalogo publico.
- images[] (product-form.tsx + app/produtos/[slug]/page.tsx) - galeria de fotos.
- active, featured, show_on_home, show_on_featured (product-form.tsx + components/admin/products/page.tsx) - flags usadas no dashboard.
- tags[] e meta_description (product-form.tsx + lib/types.ts) - SEO e filtros.
- specifications jsonb (product-form.tsx + app/api/admin/products/route.ts) - atributos tecnicos flexiveis.
- min_quantity, max_quantity e unit (product-form.tsx + app/produtos/page.tsx) - controle de quantidade/unidade exibida.
- sort_order (product-form.tsx) - ordenacao manual.
- created_at, updated_at, updated_by (lib/types.ts + logActivity em app/api/admin/products routes) - auditoria.
*/

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug = lower(slug))
    constraint products_slug_not_empty check (char_length(btrim(slug)) >= 3),
  name text not null constraint products_name_not_empty check (char_length(btrim(name)) >= 3),
  description text not null,
  category text not null constraint products_category_not_empty check (char_length(btrim(category)) >= 2),
  price numeric(12, 2) not null check (price >= 0),
  original_price numeric(12, 2) check (original_price is null or original_price >= 0),
  discount_percent numeric(5, 2) check (discount_percent is null or (discount_percent >= 0 and discount_percent <= 90)),
  discount_price numeric(12, 2) check (discount_price is null or discount_price >= 0),
  discount_start timestamptz,
  discount_end timestamptz,
  image_url text,
  thumbnail_url text,
  storage_path text,
  images text[] not null default '{}'::text[],
  active boolean not null default true,
  featured boolean not null default false,
  show_on_home boolean not null default false,
  show_on_featured boolean not null default false,
  tags text[] not null default '{}'::text[],
  meta_description text,
  specifications jsonb not null default '{}'::jsonb,
  min_quantity integer check (min_quantity is null or min_quantity >= 0),
  max_quantity integer check (max_quantity is null or max_quantity >= 0),
  unit text not null default 'unidade' constraint products_unit_not_empty check (char_length(btrim(unit)) >= 1),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.products is 'Catálogo de produtos usado no admin e na vitrine pública.';
comment on column public.products.category is 'Armazena o slug/id da categoria (product_categories.id). Transformar em FK quando a tabela estiver versionada no repo.';
comment on column public.products.storage_path is 'Prefixo no bucket products (ex.: products/<product_id>/product_main.jpg).';

create unique index if not exists products_slug_unique on public.products (slug);
create unique index if not exists products_slug_lower_unique on public.products (lower(slug));
create index if not exists products_category_idx on public.products (category);
create index if not exists products_active_idx on public.products (active) where active;
create index if not exists products_featured_idx on public.products (featured) where featured;
create index if not exists products_show_on_home_idx on public.products (show_on_home) where show_on_home;
create index if not exists products_show_on_featured_idx on public.products (show_on_featured) where show_on_featured;
create index if not exists products_sort_order_idx on public.products (sort_order, created_at desc);

create or replace function public.handle_products_updated()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists on_products_updated on public.products;
create trigger on_products_updated
before update on public.products
for each row
execute function public.handle_products_updated();

alter table public.products enable row level security;

drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
  on public.products
  for select
  using (active = true);

drop policy if exists "Editors read products" on public.products;
create policy "Editors read products"
  on public.products
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "Editors insert products" on public.products;
create policy "Editors insert products"
  on public.products
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Editors update products" on public.products;
create policy "Editors update products"
  on public.products
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Editors delete products" on public.products;
create policy "Editors delete products"
  on public.products
  for delete
  using (auth.role() = 'authenticated');
