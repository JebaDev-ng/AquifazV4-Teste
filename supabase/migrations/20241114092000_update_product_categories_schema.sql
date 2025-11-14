-- Migration: Align product_categories schema with the fields used in the app.
-- Sections: 1) Columns, 2) Comments, 3) Updated_at trigger.

-- -------------------------------
-- 1. Columns
-- -------------------------------
alter table if exists public.product_categories
  add column if not exists icon text;

-- -------------------------------
-- 2. Comments
-- -------------------------------
comment on column public.product_categories.icon is 'Nome do ícone usado no admin (ex.: lucide-react).';

-- -------------------------------
-- 3. Trigger para manter updated_at
-- -------------------------------
create or replace function public.handle_product_categories_updated()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists on_product_categories_updated on public.product_categories;
create trigger on_product_categories_updated
before update on public.product_categories
for each row
execute function public.handle_product_categories_updated();
