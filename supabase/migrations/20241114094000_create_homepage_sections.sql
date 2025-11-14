create extension if not exists "pgcrypto";

-- -------------------------------
-- Table: homepage_sections
-- -------------------------------
create table if not exists public.homepage_sections (
  id text primary key,
  title text not null constraint homepage_sections_title_not_empty check (char_length(btrim(title)) >= 3),
  subtitle text,
  layout_type text not null constraint homepage_sections_layout_check check (layout_type in ('featured', 'grid')),
  bg_color text not null constraint homepage_sections_bg_check check (bg_color in ('white', 'gray')),
  "limit" integer not null default 3 constraint homepage_sections_limit_check check ("limit" >= 1 and "limit" <= 12),
  view_all_label text not null constraint homepage_sections_view_all_label_not_empty check (char_length(btrim(view_all_label)) >= 2),
  view_all_href text not null constraint homepage_sections_view_all_href_check check (
    view_all_href ~ '^/' or view_all_href ~ '^https?://'
  ),
  category_id text references public.product_categories (id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.homepage_sections is 'Configura as vitrines de produtos exibidas na homepage.';
comment on column public.homepage_sections.config is 'Metadados extras (ex.: badgeLabel, tagline).';

create index if not exists homepage_sections_active_idx on public.homepage_sections (is_active) where is_active;
create index if not exists homepage_sections_sort_order_idx on public.homepage_sections (sort_order);

create or replace function public.handle_homepage_sections_updated()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists on_homepage_sections_updated on public.homepage_sections;
create trigger on_homepage_sections_updated
before update on public.homepage_sections
for each row
execute function public.handle_homepage_sections_updated();

-- -------------------------------
-- Table: homepage_section_items
-- -------------------------------
create table if not exists public.homepage_section_items (
  id uuid primary key default gen_random_uuid(),
  section_id text not null references public.homepage_sections (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  sort_order integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.homepage_section_items is 'Relaciona produtos aos blocos configuráveis da homepage.';

create index if not exists homepage_section_items_section_idx on public.homepage_section_items (section_id);
create index if not exists homepage_section_items_product_idx on public.homepage_section_items (product_id);
create index if not exists homepage_section_items_sort_idx on public.homepage_section_items (section_id, sort_order);

create or replace function public.handle_homepage_section_items_updated()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists on_homepage_section_items_updated on public.homepage_section_items;
create trigger on_homepage_section_items_updated
before update on public.homepage_section_items
for each row
execute function public.handle_homepage_section_items_updated();

-- -------------------------------
-- Row Level Security
-- -------------------------------
alter table public.homepage_sections enable row level security;
alter table public.homepage_section_items enable row level security;

drop policy if exists "Public read active homepage sections" on public.homepage_sections;
create policy "Public read active homepage sections"
  on public.homepage_sections
  for select
  using (is_active = true);

drop policy if exists "Public read homepage section items" on public.homepage_section_items;
create policy "Public read homepage section items"
  on public.homepage_section_items
  for select
  using (
    exists(
      select 1
      from public.homepage_sections s
      where s.id = homepage_section_items.section_id
        and s.is_active = true
    )
  );

drop policy if exists "Editors read homepage sections" on public.homepage_sections;
create policy "Editors read homepage sections"
  on public.homepage_sections
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "Editors insert homepage sections" on public.homepage_sections;
create policy "Editors insert homepage sections"
  on public.homepage_sections
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Editors update homepage sections" on public.homepage_sections;
create policy "Editors update homepage sections"
  on public.homepage_sections
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Editors delete homepage sections" on public.homepage_sections;
create policy "Editors delete homepage sections"
  on public.homepage_sections
  for delete
  using (auth.role() = 'authenticated');

drop policy if exists "Editors read homepage section items" on public.homepage_section_items;
create policy "Editors read homepage section items"
  on public.homepage_section_items
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "Editors insert homepage section items" on public.homepage_section_items;
create policy "Editors insert homepage section items"
  on public.homepage_section_items
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Editors update homepage section items" on public.homepage_section_items;
create policy "Editors update homepage section items"
  on public.homepage_section_items
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Editors delete homepage section items" on public.homepage_section_items;
create policy "Editors delete homepage section items"
  on public.homepage_section_items
  for delete
  using (auth.role() = 'authenticated');
