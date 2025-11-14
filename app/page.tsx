import { HeroSection } from '@/components/ui/hero/hero-section'
import { CategoriesSection } from '@/components/ui/categories-section'
import { FeaturedProductsSection } from '@/components/ui/featured-products-section'
import { ProductsGridSection } from '@/components/ui/products-grid-section'
import { ImageBannerSection } from '@/components/ui/image-banner-section'
import { PricingSection } from '@/components/ui/pricing/pricing-section'
import {
  DEFAULT_BANNER_CONTENT,
  DEFAULT_HERO_CONTENT,
  HERO_SECTION_ID,
  BANNER_SECTION_ID,
  DEFAULT_PRODUCT_CATEGORIES,
  DEFAULT_HOMEPAGE_SETTINGS,
  HOMEPAGE_SETTINGS_ID,
} from '@/lib/content'
import { readLocalHomepageSettings } from '@/lib/homepage-settings'
import { fetchHomepageSections } from '@/lib/homepage-sections'
import type { BannerContent, HeroContent, HomepageSettings, ProductCategory } from '@/lib/types'
import { hasSupabaseConfig } from '@/lib/supabase/env'
import { createServiceClient } from '@/lib/supabase/service'

export const revalidate = 3600

const hasSupabase = hasSupabaseConfig()

async function getSupabaseClient() {
  if (!hasSupabase) {
    return null
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      return createServiceClient()
    } catch (error) {
      console.error('Erro ao inicializar Supabase com service role:', error)
    }
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    return await createClient()
  } catch (error) {
    console.error('Erro ao inicializar Supabase:', error)
    return null
  }
}

async function getHomepageSettings(): Promise<HomepageSettings> {
  const supabase = await getSupabaseClient()
  if (!supabase) {
    return readLocalHomepageSettings()
  }

  try {
    const { data, error } = await supabase
      .from('content_sections')
      .select('data')
      .eq('id', HOMEPAGE_SETTINGS_ID)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return {
      ...DEFAULT_HOMEPAGE_SETTINGS,
      use_mock_data: data?.data?.use_mock_data ?? DEFAULT_HOMEPAGE_SETTINGS.use_mock_data,
      use_new_homepage_sections:
        data?.data?.use_new_homepage_sections ?? DEFAULT_HOMEPAGE_SETTINGS.use_new_homepage_sections,
    }
  } catch (error) {
    console.warn('Configurações da homepage indisponíveis, usando fallback local.', error)
    return readLocalHomepageSettings()
  }
}

async function getHeroContent(useMockData = false): Promise<HeroContent> {
  if (useMockData) {
    return DEFAULT_HERO_CONTENT
  }

  const supabase = await getSupabaseClient()
  if (!supabase) {
    return DEFAULT_HERO_CONTENT
  }

  try {
    const { data } = await supabase
      .from('content_sections')
      .select('*')
      .eq('id', HERO_SECTION_ID)
      .eq('active', true)
      .maybeSingle()

    if (data) {
      return {
        ...DEFAULT_HERO_CONTENT,
        is_active: data.active ?? DEFAULT_HERO_CONTENT.is_active,
        subtitle: data.subtitle ?? DEFAULT_HERO_CONTENT.subtitle,
        title: data.title ?? DEFAULT_HERO_CONTENT.title,
        description: data.description ?? DEFAULT_HERO_CONTENT.description,
        promo_image_url: data.image_url ?? DEFAULT_HERO_CONTENT.promo_image_url,
        promo_storage_path: data.promo_storage_path ?? DEFAULT_HERO_CONTENT.promo_storage_path,
        promo_title: data.data?.promo_title ?? DEFAULT_HERO_CONTENT.promo_title,
        promo_subtitle: data.data?.promo_subtitle ?? DEFAULT_HERO_CONTENT.promo_subtitle,
        whatsapp_number: data.data?.whatsapp_number ?? DEFAULT_HERO_CONTENT.whatsapp_number,
        whatsapp_message: data.data?.whatsapp_message ?? DEFAULT_HERO_CONTENT.whatsapp_message,
        hero_image_frameless: data.data?.hero_image_frameless ?? DEFAULT_HERO_CONTENT.hero_image_frameless,
      }
    }
  } catch (error) {
    console.warn('Hero content_sections indisponível, tentando tabela legada…', error)
  }

  try {
    const { data, error } = await supabase
      .from('homepage_hero_content')
      .select('*')
      .eq('id', HERO_SECTION_ID)
      .maybeSingle()

    if (!error && data) {
      return {
        ...DEFAULT_HERO_CONTENT,
        is_active: data.active ?? DEFAULT_HERO_CONTENT.is_active,
        subtitle: data.subtitle ?? DEFAULT_HERO_CONTENT.subtitle,
        title: data.title ?? DEFAULT_HERO_CONTENT.title,
        description: data.description ?? DEFAULT_HERO_CONTENT.description,
        whatsapp_number: data.whatsapp_number ?? DEFAULT_HERO_CONTENT.whatsapp_number,
        whatsapp_message: data.whatsapp_message ?? DEFAULT_HERO_CONTENT.whatsapp_message,
        promo_image_url: data.promo_image_url ?? DEFAULT_HERO_CONTENT.promo_image_url,
        promo_storage_path: data.promo_storage_path ?? DEFAULT_HERO_CONTENT.promo_storage_path,
        promo_title: data.promo_title ?? DEFAULT_HERO_CONTENT.promo_title,
        promo_subtitle: data.promo_subtitle ?? DEFAULT_HERO_CONTENT.promo_subtitle,
        hero_image_frameless: DEFAULT_HERO_CONTENT.hero_image_frameless,
      }
    }
  } catch (error) {
    console.error('Erro ao carregar hero (fallback legado):', error)
  }

  return DEFAULT_HERO_CONTENT
}

async function getBannerContent(useMockData = false): Promise<BannerContent> {
  if (useMockData) {
    return DEFAULT_BANNER_CONTENT
  }

  const supabase = await getSupabaseClient()
  if (!supabase) {
    return DEFAULT_BANNER_CONTENT
  }

  try {
    const { data } = await supabase
      .from('homepage_banner_sections')
      .select('*')
      .eq('id', BANNER_SECTION_ID)
      .maybeSingle()

    if (data) {
      return {
        id: data.id,
        enabled: data.active ?? DEFAULT_BANNER_CONTENT.enabled,
        title: data.title || DEFAULT_BANNER_CONTENT.title,
        description: data.description || DEFAULT_BANNER_CONTENT.description,
        text: data.text || DEFAULT_BANNER_CONTENT.text,
        background_color: data.background_color || DEFAULT_BANNER_CONTENT.background_color,
        text_color: data.text_color || DEFAULT_BANNER_CONTENT.text_color,
        link: data.link || DEFAULT_BANNER_CONTENT.link,
        image_url: data.image_url || DEFAULT_BANNER_CONTENT.image_url,
        storage_path: data.storage_path || DEFAULT_BANNER_CONTENT.storage_path,
        banner_image_frameless:
          data.banner_image_frameless ?? DEFAULT_BANNER_CONTENT.banner_image_frameless,
      }
    }
  } catch (error) {
    console.warn('Banner homepage table indisponível, tentando content_sections…', error)
  }

  try {
    const { data } = await supabase
      .from('content_sections')
      .select('*')
      .eq('id', BANNER_SECTION_ID)
      .maybeSingle()

    if (data) {
      return {
        id: data.id,
        enabled: data.active ?? DEFAULT_BANNER_CONTENT.enabled,
        title: data.title || DEFAULT_BANNER_CONTENT.title,
        description: data.description || DEFAULT_BANNER_CONTENT.description,
        text: data.data?.text || DEFAULT_BANNER_CONTENT.text,
        background_color: data.data?.background_color || DEFAULT_BANNER_CONTENT.background_color,
        text_color: data.data?.text_color || DEFAULT_BANNER_CONTENT.text_color,
        link: data.data?.link || DEFAULT_BANNER_CONTENT.link,
        image_url: data.image_url || data.data?.image_url || DEFAULT_BANNER_CONTENT.image_url,
        storage_path: data.storage_path || DEFAULT_BANNER_CONTENT.storage_path,
        banner_image_frameless:
          data.data?.banner_image_frameless ?? DEFAULT_BANNER_CONTENT.banner_image_frameless,
      }
    }
  } catch (error) {
    console.error('Erro ao carregar banner (fallback):', error)
  }

  return DEFAULT_BANNER_CONTENT
}

async function getProductCategories(useMockData = false): Promise<ProductCategory[]> {
  if (useMockData) {
    return DEFAULT_PRODUCT_CATEGORIES
  }

  const supabase = await getSupabaseClient()
  if (!supabase) {
    return DEFAULT_PRODUCT_CATEGORIES
  }

  try {
    const { data } = await supabase
      .from('product_categories')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (data && data.length > 0) {
      const sanitized = data.filter(
        (category) => category.active !== false && category.id !== 'uncategorized',
      )
      return sanitized.length > 0 ? sanitized : DEFAULT_PRODUCT_CATEGORIES
    }
  } catch (error) {
    console.error('Erro ao carregar categorias (fallback):', error)
  }

  return DEFAULT_PRODUCT_CATEGORIES
}

export default async function Home() {
  const homepageSettings = await getHomepageSettings()
  const useMockData = homepageSettings.use_mock_data || !hasSupabase
  const useNewHomepageSections =
    homepageSettings.use_new_homepage_sections ?? DEFAULT_HOMEPAGE_SETTINGS.use_new_homepage_sections

  const [heroContent, bannerContent, categories, homepageSections] = await Promise.all([
    getHeroContent(useMockData),
    getBannerContent(useMockData),
    getProductCategories(useMockData),
    fetchHomepageSections({ useMockData: useMockData || !useNewHomepageSections }),
  ])

  return (
    <>
      <HeroSection content={heroContent} />

      <CategoriesSection categories={categories} />

      {homepageSections.map((section) =>
        section.layout === 'featured' ? (
          <FeaturedProductsSection
            key={section.id}
            products={section.products}
            title={section.title}
            subtitle={section.subtitle}
            viewAllHref={section.viewAllHref}
            viewAllLabel={section.viewAllLabel}
            bgColor={section.bgColor}
          />
        ) : (
          <ProductsGridSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            products={section.products}
            viewAllHref={section.viewAllHref}
            viewAllLabel={section.viewAllLabel}
            bgColor={section.bgColor}
          />
        ),
      )}

      <ImageBannerSection banner={bannerContent} />

      <PricingSection />
    </>
  )

}

