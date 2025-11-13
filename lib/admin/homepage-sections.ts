import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { slugifyId } from '@/lib/content'
import type { Database } from '@/lib/database'
import type {
  HomepageSection,
  HomepageSectionItem,
  HomepageSectionProductSummary,
  HomepageSectionWithItems,
} from '@/lib/types'

export const SECTION_LAYOUTS = ['featured', 'grid'] as const
export const SECTION_BACKGROUNDS = ['white', 'gray'] as const
const SECTION_CONFIG_KEYS = ['badgeLabel', 'badgeColor', 'highlighted', 'tagline'] as const
const ITEM_METADATA_KEYS = ['badgeLabel', 'badgeColor', 'highlighted', 'tagline'] as const

const hrefMessage = 'Informe um link que comece com / ou https://'
const SECTION_SELECT = `
  *,
  items:homepage_section_items(
    id,
    section_id,
    product_id,
    sort_order,
    metadata,
    created_at,
    updated_at,
    updated_by,
    product:products(
      id,
      name,
      slug,
      price,
      unit,
      image_url,
      category
    )
  )
`

type GenericSupabaseClient = SupabaseClient<Database>

type SectionItemRecord = {
  id: string
  section_id: string
  product_id: string
  sort_order: number | null
  metadata: Record<string, string | boolean> | null
  created_at?: string | null
  updated_at?: string | null
  updated_by?: string | null
  product?: {
    id: string
    name: string
    slug: string
    price: number | null
    unit: string | null
    image_url: string | null
    category: string | null
  } | null
} | null

type SectionRecord = {
  id: string
  title: string
  subtitle: string | null
  layout_type: HomepageSection['layout_type']
  bg_color: HomepageSection['bg_color']
  limit: number | null
  view_all_label: string
  view_all_href: string
  category_id: string | null
  sort_order: number | null
  is_active: boolean | null
  config: Record<string, string | boolean> | null
  created_at?: string | null
  updated_at?: string | null
  updated_by?: string | null
  items?: SectionItemRecord[] | null
}

type SectionItemUpdate = {
  id: string
  sort_order: number
  updated_at: string
  updated_by: string
}

const sectionFieldsSchema = z.object({
  title: z.string().trim().min(3).max(120),
  subtitle: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  layout_type: z.enum(SECTION_LAYOUTS),
  bg_color: z.enum(SECTION_BACKGROUNDS),
  limit: z.number().int().min(1).max(12).optional(),
  view_all_label: z.string().trim().min(2).max(80),
  view_all_href: z
    .string()
    .trim()
    .min(1)
    .refine(isValidHref, { message: hrefMessage }),
  category_id: z
    .string()
    .trim()
    .max(80)
    .nullable()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  sort_order: z.number().int().min(0).max(500).optional(),
  is_active: z.boolean().optional(),
  config: z
    .record(z.string(), z.union([z.string(), z.boolean()]))
    .optional()
    .transform((value) => (value ? sanitizeSectionConfig(value) : undefined)),
})

export const createSectionSchema = sectionFieldsSchema.extend({
  id: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hifens')
    .optional(),
})

export const updateSectionSchema = sectionFieldsSchema

export const reorderSectionSchema = z.object({
  sort_order: z.number().int().min(0).max(500),
})

export const addItemSchema = z.object({
  product_id: z.string().uuid(),
  sort_order: z.number().int().min(1).max(50).optional(),
  metadata: z
    .record(z.string(), z.union([z.string(), z.boolean()]))
    .optional()
    .transform((value) => (value ? sanitizeItemMetadata(value) : undefined)),
})

export const updateItemSchema = z
  .object({
    sort_order: z.number().int().min(1).max(50).optional(),
    metadata: z
      .record(z.string(), z.union([z.string(), z.boolean()]))
      .optional()
      .transform((value) => (value ? sanitizeItemMetadata(value) : undefined)),
  })
  .refine((value) => value.sort_order !== undefined || value.metadata !== undefined, {
    message: 'Informe ao menos sort_order ou metadata.',
  })

export const reorderItemsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        sort_order: z.number().int().min(0).max(100),
      }),
    )
    .min(1),
})

export function isValidHref(value: string) {
  if (!value) return false
  const trimmed = value.trim()
  return trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed)
}

export function sanitizeHref(value: string) {
  const trimmed = value.trim()
  if (isValidHref(trimmed)) {
    return trimmed.startsWith('/') ? trimmed : trimmed
  }
  return '/produtos'
}

export function sanitizeSectionConfig(config?: Record<string, unknown>) {
  if (!config || typeof config !== 'object') {
    return {}
  }

  const sanitized: Record<string, string | boolean> = {}
  for (const key of SECTION_CONFIG_KEYS) {
    const value = config[key]
    if (typeof value === 'string') {
      sanitized[key] = value.slice(0, 120)
    } else if (typeof value === 'boolean') {
      sanitized[key] = value
    }
  }
  return sanitized
}

export function sanitizeItemMetadata(metadata?: Record<string, unknown>) {
  if (!metadata || typeof metadata !== 'object') {
    return {}
  }

  const sanitized: Record<string, string | boolean> = {}
  for (const key of ITEM_METADATA_KEYS) {
    const value = metadata[key]
    if (typeof value === 'string') {
      sanitized[key] = value.slice(0, 120)
    } else if (typeof value === 'boolean') {
      sanitized[key] = value
    }
  }
  return sanitized
}

export function generateSectionId(inputId: string | undefined, title: string) {
  return slugifyId(inputId ?? title)
}

export function mapSectionRecord(record: SectionRecord): HomepageSectionWithItems {
  const rawItems = Array.isArray(record?.items) ? record.items : []
  const items = rawItems
    .map((item) => (item ? mapSectionItemRecord(item) : null))
    .filter((item): item is HomepageSectionItem => Boolean(item))
    .sort((a, b) => a.sort_order - b.sort_order)

  return {
    id: record.id,
    title: record.title,
    subtitle: record.subtitle ?? null,
    layout_type: record.layout_type,
    bg_color: record.bg_color,
  limit: record.limit ?? 3,
    view_all_label: record.view_all_label,
    view_all_href: record.view_all_href,
    category_id: record.category_id ?? null,
    sort_order: record.sort_order ?? 0,
    is_active: record.is_active ?? true,
    config: record.config ?? {},
    created_at: record.created_at ?? undefined,
    updated_at: record.updated_at ?? undefined,
    updated_by: record.updated_by ?? undefined,
    items,
  }
}

export function mapSectionItemRecord(record: Exclude<SectionItemRecord, null>): HomepageSectionItem {
  const product: HomepageSectionProductSummary | undefined = record.product
    ? {
        id: record.product.id,
        name: record.product.name,
        slug: record.product.slug,
        price: Number(record.product.price ?? 0),
        unit: record.product.unit || 'unidade',
        image_url: record.product.image_url || null,
        category: record.product.category || undefined,
      }
    : undefined

  return {
    id: record.id,
    section_id: record.section_id,
    product_id: record.product_id,
    sort_order: record.sort_order ?? 0,
    metadata: record.metadata ?? {},
    created_at: record.created_at ?? undefined,
    updated_at: record.updated_at ?? undefined,
    updated_by: record.updated_by ?? undefined,
    product,
  }
}

export function clampIndex(value: number, length: number) {
  const maxIndex = Math.max(length, 0)
  if (Number.isNaN(value) || !Number.isFinite(value)) return maxIndex
  return Math.min(Math.max(value, 0), maxIndex)
}

export async function fetchHomepageSections(
  client: GenericSupabaseClient,
): Promise<{ data: SectionRecord[] | null; error: PostgrestError | null }> {
  return client
    .from('homepage_sections')
    .select(SECTION_SELECT)
    .order('sort_order', { ascending: true })
    .order('sort_order', { ascending: true, foreignTable: 'homepage_section_items' })
}

export async function fetchHomepageSectionById(
  client: GenericSupabaseClient,
  id: string,
): Promise<{ data: SectionRecord | null; error: PostgrestError | null }> {
  return client
    .from('homepage_sections')
    .select(SECTION_SELECT)
    .eq('id', id)
    .maybeSingle()
}

export async function listSectionItemIds(
  client: GenericSupabaseClient,
  sectionId: string,
) {
  const { data, error } = await client
    .from('homepage_section_items')
    .select('id')
    .eq('section_id', sectionId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  const rows = (data ?? []) as Array<{ id: string }>
  return rows.map((row) => row.id)
}

export async function saveSectionItemOrder(
  client: GenericSupabaseClient,
  orderedIds: string[],
  userId: string,
) {
  if (!orderedIds.length) return

  const now = new Date().toISOString()
  const updates = orderedIds.map((id, index) => ({
    id,
    sort_order: index + 1,
    updated_at: now,
    updated_by: userId,
  })) as SectionItemUpdate[]

  const sectionItemsTable = client.from('homepage_section_items') as unknown as {
    upsert: (values: SectionItemUpdate[], options?: { onConflict?: string }) => Promise<{ error: PostgrestError | null }>
  }

  const { error } = await sectionItemsTable.upsert(updates, { onConflict: 'id' })
  if (error) throw error
}
