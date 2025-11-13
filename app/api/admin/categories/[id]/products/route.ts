import { NextRequest, NextResponse } from 'next/server'

import { requireEditor } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  await requireEditor()
  const { id: categoryId } = await context.params
  const supabase = await createClient()

  const { data, error, count } = await supabase
    .from('products')
    .select('id, name, slug, category, active, image_url', { count: 'exact' })
    .eq('category', categoryId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Erro ao buscar produtos da categoria:', error)
    return NextResponse.json(
      { error: 'Não foi possível carregar os produtos.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    category_id: categoryId,
    products: data ?? [],
    total: count ?? 0,
  })
}
