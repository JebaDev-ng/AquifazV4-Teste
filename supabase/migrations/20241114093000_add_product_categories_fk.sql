-- Migration: Enforce Products ↔ Categories relationship.
-- Sections: 1) Seed safety categories, 2) Repair product rows, 3) FK constraint.

-- -------------------------------
-- 1. Categorias obrigatórias
-- -------------------------------
insert into public.product_categories (id, name, description, icon, active, sort_order, created_at, updated_at)
values (
  'uncategorized',
  'Sem Categoria',
  'Produtos sem categoria definida',
  'HelpCircle',
  true,
  999,
  timezone('utc', now()),
  timezone('utc', now())
)
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    active = excluded.active,
    sort_order = excluded.sort_order,
    updated_at = timezone('utc', now());

with missing_categories as (
  select distinct p.category
  from public.products p
  left join public.product_categories c on c.id = p.category
  where p.category is not null
    and char_length(btrim(p.category)) > 0
    and c.id is null
)
insert into public.product_categories (id, name, description, active, sort_order, created_at, updated_at)
select
  mc.category,
  initcap(replace(mc.category, '-', ' ')),
  'Categoria criada automaticamente a partir de produtos existentes.',
  true,
  800 + row_number() over (order by mc.category),
  timezone('utc', now()),
  timezone('utc', now())
from missing_categories mc;

-- -------------------------------
-- 2. Ajuste de produtos órfãos
-- -------------------------------
update public.products
set category = 'uncategorized'
where category is null
   or char_length(btrim(category)) = 0;

-- -------------------------------
-- 3. Constraint
-- -------------------------------
alter table public.products
  add constraint products_category_fkey
  foreign key (category)
  references public.product_categories (id)
  on update cascade
  on delete restrict
  not valid;

alter table public.products
  validate constraint products_category_fkey;

comment on column public.products.category is 'Slug/ID da categoria (FK para product_categories.id).';
