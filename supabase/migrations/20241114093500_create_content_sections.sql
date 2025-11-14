create extension if not exists "pgcrypto";

-- -------------------------------
-- Table: content_sections
-- -------------------------------
create table if not exists public.content_sections (
  id text primary key,
  type text not null check (char_length(btrim(type)) > 0),
  title text,
  subtitle text,
  description text,
  image_url text,
  storage_path text,
  promo_storage_path text,
  cta_label text,
  cta_link text,
  data jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.content_sections is 'Armazena hero, banners e outras seções estáticas da homepage.';
comment on column public.content_sections.type is 'Tipo lógico (hero, banner, settings, etc).';
comment on column public.content_sections.data is 'Payload flexível (ex.: whatsapp_number, cores do banner).';

create index if not exists content_sections_type_idx on public.content_sections (type);
create index if not exists content_sections_active_idx on public.content_sections (active) where active;
create index if not exists content_sections_sort_order_idx on public.content_sections (sort_order, updated_at desc);

create or replace function public.handle_content_sections_updated()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists on_content_sections_updated on public.content_sections;
create trigger on_content_sections_updated
before update on public.content_sections
for each row
execute function public.handle_content_sections_updated();

alter table public.content_sections enable row level security;

drop policy if exists "Public read active content sections" on public.content_sections;
create policy "Public read active content sections"
  on public.content_sections
  for select
  using (active = true);

drop policy if exists "Editors read content sections" on public.content_sections;
create policy "Editors read content sections"
  on public.content_sections
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "Editors insert content sections" on public.content_sections;
create policy "Editors insert content sections"
  on public.content_sections
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Editors update content sections" on public.content_sections;
create policy "Editors update content sections"
  on public.content_sections
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Editors delete content sections" on public.content_sections;
create policy "Editors delete content sections"
  on public.content_sections
  for delete
  using (auth.role() = 'authenticated');
