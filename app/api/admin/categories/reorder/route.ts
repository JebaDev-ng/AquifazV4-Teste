import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin, logActivity } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'

const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        sort_order: z.number().int().min(1),
      }),
    )
    .min(1, 'Envie ao menos um item para reordenar'),
})

export async function POST(request: NextRequest) {
  await requireAdmin()

  try {
    const body = await request.json()
    const { items } = reorderSchema.parse(body)

    const supabase = await createClient()

    const ids = items.map((item) => item.id)
    const { data: existing, error: fetchError } = await supabase
      .from('product_categories')
      .select('id')
      .in('id', ids)

    if (fetchError) {
      console.error('Erro ao verificar categorias para reorder:', fetchError)
      return NextResponse.json({ error: 'Falha ao verificar categorias.' }, { status: 500 })
    }

    const existingIds = new Set((existing ?? []).map((category) => category.id as string))
    const missing = ids.filter((id) => !existingIds.has(id))
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `IDs inexistentes: ${missing.join(', ')}` },
        { status: 400 },
      )
    }

    for (const item of items) {
      const { error: updateError } = await supabase
        .from('product_categories')
        .update({
          sort_order: item.sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)

      if (updateError) {
        console.error('Erro ao atualizar sort_order:', updateError)
        return NextResponse.json(
          { error: `Falha ao atualizar ordem para ID ${item.id}` },
          { status: 500 },
        )
      }
    }

    await logActivity('category_reordered', 'product_category', undefined, undefined, { items })

    return NextResponse.json({ reordered: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 },
      )
    }
    console.error('Erro inesperado no reorder de categorias:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
