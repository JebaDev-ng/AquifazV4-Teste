import { NextResponse } from 'next/server'

import { requireAdmin, logActivity } from '@/lib/admin/auth'
import { DEFAULT_PRODUCT_CATEGORIES } from '@/lib/content'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  await requireAdmin()
  const supabase = await createClient()
  const timestamp = new Date().toISOString()

  // Buscar categorias existentes
  const { data: existingCategories, error: fetchError } = await supabase
    .from('product_categories')
    .select('*')

  if (fetchError) {
    console.error('Erro ao buscar categorias existentes:', fetchError)
    return NextResponse.json(
      { error: 'Não foi possível verificar categorias existentes.' },
      { status: 500 }
    )
  }

  const existingMap = new Map(
    (existingCategories || []).map((cat) => [cat.id, cat])
  )

  // Identificar categorias faltantes (que precisam ser criadas)
  const missingCategories = DEFAULT_PRODUCT_CATEGORIES.filter(
    (baseCategory) => !existingMap.has(baseCategory.id)
  )

  if (missingCategories.length === 0) {
    return NextResponse.json({
      message: 'Nenhuma categoria faltante. Todas as categorias base já existem.',
      categories: existingCategories,
      created: [],
    })
  }

  // Criar apenas as categorias faltantes
  const payload = missingCategories.map((category, index) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    image_url: category.image_url,
    active: category.active ?? true,
    sort_order: category.sort_order ?? DEFAULT_PRODUCT_CATEGORIES.length + index + 1,
    created_at: timestamp,
    updated_at: timestamp,
  }))

  const { error: insertError } = await supabase
    .from('product_categories')
    .insert(payload)
    .select()

  if (insertError) {
    console.error('Erro ao criar categorias faltantes:', insertError)
    return NextResponse.json(
      { error: 'Não foi possível criar as categorias faltantes.' },
      { status: 500 }
    )
  }

  await logActivity('category_synced', 'product_category', undefined, undefined, {
    created: payload.map((item) => item.id),
    skipped: Array.from(existingMap.keys()),
  })

  // Buscar lista atualizada
  const { data: updatedCategories } = await supabase
    .from('product_categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  return NextResponse.json({
    message: `${missingCategories.length} categoria(s) criada(s) com sucesso.`,
    categories: updatedCategories ?? [],
    created: payload.map((item) => item.id),
  })
}
