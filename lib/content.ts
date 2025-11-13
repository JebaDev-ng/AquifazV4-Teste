import type { BannerContent, HeroContent, HomepageSettings, ProductCategory } from './types'

export const HERO_SECTION_ID = 'hero_main'
export const BANNER_SECTION_ID = 'home_banner'
export const HOMEPAGE_SETTINGS_ID = 'homepage_settings'
export const DEFAULT_CATEGORY_IMAGE = '/categories/default-placeholder.jpg'

export const DEFAULT_HERO_CONTENT: HeroContent = {
  is_active: true,
  subtitle: 'A sua gráfica em Araguaína',
  title: 'Aquifaz trabalha\ncom diversos serviços',
  description: 'Tanto na área gráfica quanto na digital. Veja o que podemos fazer por você hoje!',
  whatsapp_number: '5563992731977',
  whatsapp_message: 'Olá! Vim pelo site e gostaria de conhecer os serviços da AquiFaz.',
  cta_label: 'Falar no WhatsApp',
  cta_link: 'https://wa.me/5563992731977?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20AquiFaz%20e%20gostaria%20de%20conhecer%20os%20servi%C3%A7os.',
  image_url: '',
  storage_path: '',
  promo_image_url: '',
  promo_storage_path: '',
  promo_title: '',
  promo_subtitle: '',
  hero_image_frameless: false,
}

export const DEFAULT_BANNER_CONTENT: BannerContent = {
  id: BANNER_SECTION_ID,
  title: 'Solicite um orçamento rápido',
  description: 'Converse com nossa equipe criativa e receba propostas personalizadas.',
  text: 'Prontos para criar sua próxima peça? Clique e fale com a AquiFaz pelo WhatsApp.',
  enabled: true,
  background_color: '#1D1D1F',
  text_color: '#FFFFFF',
  link: 'https://wa.me/5563992731977?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20gostaria%20de%20fazer%20um%20or%C3%A7amento.',
  image_url: '',
  storage_path: '',
  banner_image_frameless: false,
}

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  use_mock_data: false,
  use_new_homepage_sections: true,
}

export const DEFAULT_PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: 'cartoes',
    name: 'Cartões de Visita',
    description: 'Cartões profissionais e empresariais',
    icon: 'CreditCard',
    image_url: '/categories/cartoes.jpg',
    active: true,
    sort_order: 1,
  },
  {
    id: 'banners',
    name: 'Banners e Fachadas',
    description: 'Sinalização visual e publicitária',
    icon: 'PanelsTopLeft',
    image_url: '',
    active: true,
    sort_order: 2,
  },
  {
    id: 'adesivos',
    name: 'Adesivos',
    description: 'Etiquetas e adesivos personalizados',
    icon: 'Sticker',
    image_url: '',
    active: true,
    sort_order: 3,
  },
  {
    id: 'print',
    name: 'Impressões',
    description: 'Serviços gerais de impressão',
    icon: 'Printer',
    image_url: '',
    active: true,
    sort_order: 4,
  },
  {
    id: 'flyers',
    name: 'Flyers e Panfletos',
    description: 'Materiais publicitários para distribuição',
    icon: 'Files',
    image_url: '',
    active: true,
    sort_order: 5,
  },
  {
    id: 'uncategorized',
    name: 'Sem Categoria',
    description: 'Produtos sem categoria definida',
    icon: 'HelpCircle',
    image_url: '',
    active: true,
    sort_order: 999,
  },
]

export function buildWhatsAppLink(number: string, message: string) {
  const digits = number.replace(/\D/g, '')
  const sanitizedNumber = digits.length > 0 ? digits : DEFAULT_HERO_CONTENT.whatsapp_number
  const encodedMessage = encodeURIComponent(message || DEFAULT_HERO_CONTENT.whatsapp_message)
  return `https://wa.me/${sanitizedNumber}?text=${encodedMessage}`
}

export function slugifyId(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
