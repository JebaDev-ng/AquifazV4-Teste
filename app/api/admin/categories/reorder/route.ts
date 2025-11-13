import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin, logActivity } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'

const reorderSchema = z.object({
  order: z
    .array(z.string().trim().min(1))
    .min(1, 'Envie ao menos um ID para reordenar')
    .refine((arr) => new Set(arr).size === arr.length, 'IDs duplicados na ordem enviada'),
})

export async function POST(request: NextRequest) {
  await requireAdmin()

  try {
    const body = await request.json()
    const { order } = reorderSchema.parse(body)

    const supabase = await createClient()

    // Verificar se todos os IDs existem (opcional, mas ajuda a retornar erro cedo)
    const { data: existing, error: fetchError } = await supabase
      .from('product_categories')
      .select('id')
      .in('id', order)

    if (fetchError) {
      console.error('Erro ao verificar categorias para reorder:', fetchError)
      return NextResponse.json({ error: 'Falha ao verificar categorias.' }, { status: 500 })
    }

    const existingIds = new Set((existing ?? []).map((c) => c.id as string))
    const missing = order.filter((id) => !existingIds.has(id))
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `IDs inexistentes: ${missing.join(', ')}` },
        { status: 400 },
      )
    }

    // Aplicar nova ordem (0-based, consistente com validação min 0)
    // Atualizações em série para simplicidade e clareza; volume é baixo no admin
    for (let index = 0; index < order.length; index++) {
      const id = order[index]
      const { error: updateError } = await supabase
        .from('product_categories')
        .update({ sort_order: index, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) {
        console.error('Erro ao atualizar sort_order:', updateError)
        return NextResponse.json(
          { error: `Falha ao atualizar ordem para ID ${id}` },
          { status: 500 },
        )
      }
    }

    await logActivity('category_reordered', 'product_category', undefined, undefined, { order })

    const { data: updated } = await supabase
      .from('product_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    return NextResponse.json({ reordered: true, order, categories: updated ?? [] })
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
