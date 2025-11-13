import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin, logActivity } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'

const moveProductsSchema = z.object({
  product_ids: z.array(z.string().uuid()).min(1, 'Informe ao menos um produto'),
  target_category_id: z.string().min(1, 'Informe a categoria de destino'),
})

export async function POST(request: NextRequest) {
  await requireAdmin()

  try {
    const body = await request.json()
    const parsed = moveProductsSchema.parse(body)

    const supabase = await createClient()

    // Verificar se a categoria de destino existe
    const { data: targetCategory, error: categoryError } = await supabase
      .from('product_categories')
      .select('id, name')
      .eq('id', parsed.target_category_id)
      .single()

    if (categoryError || !targetCategory) {
      return NextResponse.json(
        { error: 'Categoria de destino não encontrada.' },
        { status: 404 }
      )
    }

    // Atualizar produtos
    const { data: updatedProducts, error: updateError } = await supabase
      .from('products')
      .update({ category: parsed.target_category_id, updated_at: new Date().toISOString() })
      .in('id', parsed.product_ids)
      .select('id, name, category')

    if (updateError) {
      console.error('Erro ao mover produtos:', updateError)
      return NextResponse.json(
        { error: 'Não foi possível mover os produtos.' },
        { status: 500 }
      )
    }

    await logActivity('products_moved', 'product', undefined, undefined, {
      product_ids: parsed.product_ids,
      target_category: targetCategory.id,
      count: updatedProducts?.length ?? 0,
    })

    return NextResponse.json({
      message: `${updatedProducts?.length ?? 0} produto(s) movido(s) para "${targetCategory.name}".`,
      moved: updatedProducts?.length ?? 0,
      products: updatedProducts ?? [],
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro inesperado ao mover produtos:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
