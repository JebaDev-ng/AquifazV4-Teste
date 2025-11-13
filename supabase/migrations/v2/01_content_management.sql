-- =====================================================
-- MIGRATION V2: Gerenciamento de Conteúdo
-- Data: 2024-11-12
-- Descrição: Tabelas para hero, banners e seções da homepage
-- =====================================================

BEGIN;

-- =====================================================
-- TABELA: content_sections
-- Conteúdo editável genérico (hero, banners, etc)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.content_sections (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('hero', 'banner', 'pricing', 'footer', 'settings')),
  title TEXT,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  storage_path TEXT,
  promo_storage_path TEXT,
  cta_text TEXT,
  cta_link TEXT,
  data JSONB DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_content_sections_type ON public.content_sections(type);
CREATE INDEX IF NOT EXISTS idx_content_sections_active ON public.content_sections(active);

CREATE TRIGGER trg_content_sections_updated
  BEFORE UPDATE ON public.content_sections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.content_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conteúdo visível para todos"
  ON public.content_sections FOR SELECT
  USING (TRUE);

CREATE POLICY "Apenas admins podem gerenciar conteúdo"
  ON public.content_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- TABELA: homepage_hero_content
-- Hero section específico (compatibilidade)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.homepage_hero_content (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  whatsapp_number TEXT,
  whatsapp_message TEXT,
  promo_image_url TEXT,
  promo_storage_path TEXT,
  promo_title TEXT,
  promo_subtitle TEXT,
  hero_image_frameless BOOLEAN DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TRIGGER trg_homepage_hero_updated
  BEFORE UPDATE ON public.homepage_hero_content
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.homepage_hero_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hero visível para todos"
  ON public.homepage_hero_content FOR SELECT
  USING (TRUE);

CREATE POLICY "Apenas admins podem gerenciar hero"
  ON public.homepage_hero_content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- TABELA: homepage_banner_sections
-- Banners da homepage
-- =====================================================

CREATE TABLE IF NOT EXISTS public.homepage_banner_sections (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  text TEXT NOT NULL,
  link TEXT,
  background_color TEXT DEFAULT '#1D1D1F',
  text_color TEXT DEFAULT '#FFFFFF',
  image_url TEXT,
  storage_path TEXT,
  banner_image_frameless BOOLEAN DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TRIGGER trg_homepage_banner_updated
  BEFORE UPDATE ON public.homepage_banner_sections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.homepage_banner_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Banners visíveis para todos"
  ON public.homepage_banner_sections FOR SELECT
  USING (TRUE);

CREATE POLICY "Apenas admins podem gerenciar banners"
  ON public.homepage_banner_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- TABELA: homepage_sections
-- Seções configuráveis da homepage
-- =====================================================

CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  layout_type TEXT NOT NULL DEFAULT 'grid' CHECK (layout_type IN ('featured', 'grid')),
  bg_color TEXT NOT NULL DEFAULT 'white' CHECK (bg_color IN ('white', 'gray')),
  "limit" INTEGER NOT NULL DEFAULT 3 CHECK ("limit" > 0 AND "limit" <= 12),
  view_all_label TEXT NOT NULL DEFAULT 'Ver todos',
  view_all_href TEXT NOT NULL DEFAULT '/produtos',
  category_id TEXT REFERENCES public.product_categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_homepage_sections_sort_order ON public.homepage_sections(sort_order);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_active ON public.homepage_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_category ON public.homepage_sections(category_id);

CREATE TRIGGER trg_homepage_sections_updated
  BEFORE UPDATE ON public.homepage_sections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seções visíveis para todos"
  ON public.homepage_sections FOR SELECT
  USING (TRUE);

CREATE POLICY "Apenas admins podem gerenciar seções"
  ON public.homepage_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- TABELA: homepage_section_items
-- Produtos dentro das seções da homepage
-- =====================================================

CREATE TABLE IF NOT EXISTS public.homepage_section_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id TEXT NOT NULL REFERENCES public.homepage_sections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_homepage_section_items_unique_product
  ON public.homepage_section_items(section_id, product_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_homepage_section_items_order
  ON public.homepage_section_items(section_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_homepage_section_items_section ON public.homepage_section_items(section_id);

CREATE TRIGGER trg_homepage_section_items_updated
  BEFORE UPDATE ON public.homepage_section_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.homepage_section_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Items de seção visíveis para todos"
  ON public.homepage_section_items FOR SELECT
  USING (TRUE);

CREATE POLICY "Apenas admins podem gerenciar items de seção"
  ON public.homepage_section_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMIT;
