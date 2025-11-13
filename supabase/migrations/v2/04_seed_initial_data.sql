-- =====================================================
-- MIGRATION V2: Dados Iniciais
-- Data: 2024-11-12
-- Descrição: Seed com dados mínimos necessários
--            (hero, banner, settings - SEM categorias)
-- =====================================================

BEGIN;

-- =====================================================
-- HERO SECTION
-- =====================================================

INSERT INTO public.homepage_hero_content (
  id,
  title,
  subtitle,
  description,
  whatsapp_number,
  whatsapp_message,
  promo_image_url,
  promo_storage_path,
  promo_title,
  promo_subtitle,
  hero_image_frameless,
  active
)
VALUES (
  'hero_main',
  E'Aquifaz trabalha\ncom diversos serviços',
  'A sua gráfica em Araguaína',
  'Tanto na área gráfica quanto na digital. Veja o que podemos fazer por você hoje!',
  '5563992731977',
  'Olá! Vim pelo site e gostaria de conhecer os serviços da AquiFaz.',
  NULL,
  NULL,
  NULL,
  NULL,
  FALSE,
  TRUE
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    description = EXCLUDED.description,
    whatsapp_number = EXCLUDED.whatsapp_number,
    whatsapp_message = EXCLUDED.whatsapp_message,
    active = EXCLUDED.active;

-- =====================================================
-- BANNER SECTION
-- =====================================================

INSERT INTO public.homepage_banner_sections (
  id,
  title,
  description,
  text,
  link,
  background_color,
  text_color,
  image_url,
  storage_path,
  banner_image_frameless,
  active,
  sort_order
)
VALUES (
  'home_banner',
  'Solicite um orçamento rápido',
  'Converse com nossa equipe criativa e receba propostas personalizadas.',
  'Prontos para criar sua próxima peça? Clique e fale com a AquiFaz pelo WhatsApp.',
  'https://wa.me/5563992731977?text=Olá!%20Vim%20pelo%20site%20e%20gostaria%20de%20fazer%20um%20orçamento.',
  '#1D1D1F',
  '#FFFFFF',
  NULL,
  NULL,
  FALSE,
  TRUE,
  1
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    text = EXCLUDED.text,
    link = EXCLUDED.link,
    background_color = EXCLUDED.background_color,
    text_color = EXCLUDED.text_color,
    active = EXCLUDED.active,
    sort_order = EXCLUDED.sort_order;

-- =====================================================
-- HOMEPAGE SETTINGS
-- =====================================================

INSERT INTO public.content_sections (
  id,
  type,
  title,
  data,
  active
)
VALUES (
  'homepage_settings',
  'settings',
  'Configurações da Homepage',
  jsonb_build_object(
    'use_mock_data', FALSE,
    'use_new_homepage_sections', TRUE
  ),
  TRUE
)
ON CONFLICT (id) DO UPDATE
SET data = EXCLUDED.data,
    active = EXCLUDED.active;

-- =====================================================
-- PROMOVER TODOS OS USUÁRIOS EXISTENTES A ADMIN
-- =====================================================

-- Promover todos os usuários existentes que ainda não têm perfil
DO $$
DECLARE
  user_record RECORD;
  promoted_count INTEGER := 0;
BEGIN
  -- Iterar sobre todos os usuários do auth.users
  FOR user_record IN
    SELECT id, email, raw_user_meta_data
    FROM auth.users
  LOOP
    -- Inserir ou atualizar perfil como admin
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.raw_user_meta_data->>'full_name', user_record.email),
      'admin'
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin',
        updated_at = TIMEZONE('utc', NOW());
    
    promoted_count := promoted_count + 1;
  END LOOP;

  IF promoted_count > 0 THEN
    RAISE NOTICE '% usuário(s) promovido(s) a admin!', promoted_count;
  ELSE
    RAISE NOTICE 'Nenhum usuário encontrado. Crie usuários no Supabase Auth.';
  END IF;
END $$;

COMMIT;

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================
-- As categorias NÃO são mais inseridas automaticamente.
-- O admin deve criar as categorias manualmente via painel administrativo.
-- Isso elimina a necessidade de sincronização e dá controle total ao admin.

-- =====================================================
-- COMO PROMOVER OUTRO USUÁRIO A ADMIN
-- =====================================================
-- Execute no SQL Editor do Supabase:
-- SELECT public.promote_user_to_admin('email@exemplo.com');
