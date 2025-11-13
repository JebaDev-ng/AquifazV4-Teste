export interface Product {
  id: string
  name: string
  slug: string
  description: string
  category: string
  price: number
  image_url: string
  storage_path?: string
  created_at: string
 
  // Campos administrativos
  active?: boolean
  featured?: boolean
  show_on_home?: boolean
  show_on_featured?: boolean
  
  // Campos de mídia
  images?: string[]
  thumbnail_url?: string
  
  // Campos comerciais
  original_price?: number
  discount_percent?: number
  discount_price?: number
  discount_start?: string
  discount_end?: string
  
  // Campos técnicos
  specifications?: Record<string, unknown>
  min_quantity?: number
  max_quantity?: number
  unit?: string
  
  // SEO e organização
  tags?: string[]
  meta_description?: string
  sort_order?: number
  
  // Auditoria
  updated_at?: string
  updated_by?: string
}

export interface CartItem {
  id: string
  product_id: string
  quantity: number
  product?: Product
}

export interface Order {
  id: string
  user_id: string
  total: number
  status: string
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
}

// =====================================================
// TIPOS PARA PAINEL ADMINISTRATIVO
// =====================================================

export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: 'admin' | 'editor' | 'viewer'
  created_at: string
  updated_at: string
}

export interface ContentSection {
  id: string
  type: 'hero' | 'banner' | 'pricing' | 'footer'
  title?: string
  subtitle?: string
  description?: string
  image_url?: string
  cta_text?: string
  cta_link?: string
  data?: Record<string, unknown>
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  updated_by?: string
}

export interface HeroContent {
  is_active?: boolean
  subtitle: string
  title: string
  description: string
  whatsapp_number: string
  whatsapp_message: string
  cta_label?: string
  cta_link?: string
  image_url?: string
  storage_path?: string
  promo_image_url?: string
  promo_storage_path?: string
  promo_title?: string
  promo_subtitle?: string
  hero_image_frameless?: boolean
}

export interface BannerContent {
  id?: string
  title?: string
  description?: string
  text: string
  enabled: boolean
  background_color: string
  text_color: string
  link?: string
  image_url?: string
  storage_path?: string
  banner_image_frameless?: boolean
}

export interface HomepageSettings {
  use_mock_data: boolean
  use_new_homepage_sections: boolean
}

export interface HomepageSection {
  id: string
  title: string
  subtitle?: string | null
  layout_type: 'featured' | 'grid'
  bg_color: 'white' | 'gray'
  limit: number
  view_all_label: string
  view_all_href: string
  category_id?: string | null
  sort_order: number
  is_active: boolean
  config?: Record<string, unknown>
  created_at?: string
  updated_at?: string
  updated_by?: string
}

export interface HomepageSectionProductSummary {
  id: string
  name: string
  slug: string
  description?: string
  category?: string
  price: number
  original_price?: number
  discount_percent?: number
  unit: string
  image_url?: string | null
  images?: string[]
  storage_path?: string | null
}

export interface HomepageSectionItem {
  id: string
  section_id: string
  product_id: string
  sort_order: number
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
  updated_by?: string
  product?: HomepageSectionProductSummary
}

export interface HomepageSectionWithItems extends HomepageSection {
  items: HomepageSectionItem[]
}

export interface Media {
  id: string
  filename: string
  original_name: string
  url: string
  storage_path: string
  size: number
  mime_type: string
  width?: number
  height?: number
  alt_text?: string
  category: string
  uploaded_by?: string
  checksum?: string
  created_at: string
}

export interface ProductCategory {
  id: string
  name: string
  description?: string
  icon?: string
  image_url?: string
  storage_path?: string
  active?: boolean
  sort_order?: number
  created_at?: string
  updated_at?: string
}

export interface ActivityLog {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface DashboardStats {
  total_products: number
  active_products: number
  featured_products: number
  total_categories: number
  total_media: number
  recent_uploads: number
  total_content_sections: number
}

export interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  error?: string
}
