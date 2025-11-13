import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin, logActivity } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'

const unlinkProductsSchema = z.object({
  product_ids: z.array(z.string().uuid()).min(1, 'Informe ao menos um produto'),
})

const UNCATEGORIZED_ID = 'uncategorized'
const UNCATEGORIZED_CATEGORY = {
  id: UNCATEGORIZED_ID,
  name: 'Sem Categoria',
  description: 'Produtos sem categoria definida',
  icon: 'HelpCircle',
  active: true,
  sort_order: 999,
}

export async function POST(request: NextRequest) {
  await requireAdmin()

  try {
    const body = await request.json()
    const parsed = unlinkProductsSchema.parse(body)

    const supabase = await createClient()

    // Verificar se categoria "uncategorized" existe, senão criar
    const { data: uncategorizedExists } = await supabase
      .from('product_categories')
      .select('id')
      .eq('id', UNCATEGORIZED_ID)
      .single()

    if (!uncategorizedExists) {
      const timestamp = new Date().toISOString()
      const { error: createError } = await supabase
        .from('product_categories')
        .insert({
          ...UNCATEGORIZED_CATEGORY,
          created_at: timestamp,
          updated_at: timestamp,
        })

      if (createError) {
        console.error('Erro ao criar categoria "Sem Categoria":', createError)
        return NextResponse.json(
          { error: 'Não foi possível criar a categoria "Sem Categoria".' },
          { status: 500 }
        )
      }
    }

    // Atualizar produtos para categoria "uncategorized"
    const { data: updatedProducts, error: updateError } = await supabase
      .from('products')
      .update({ category: UNCATEGORIZED_ID, updated_at: new Date().toISOString() })
      .in('id', parsed.product_ids)
      .select('id, name, category')

    if (updateError) {
      console.error('Erro ao desvincular produtos:', updateError)
      return NextResponse.json(
        { error: 'Não foi possível desvincular os produtos.' },
        { status: 500 }
      )
    }

    await logActivity('products_unlinked', 'product', undefined, undefined, {
      product_ids: parsed.product_ids,
      count: updatedProducts?.length ?? 0,
    })

    return NextResponse.json({
      message: `${updatedProducts?.length ?? 0} produto(s) desvinculado(s) com sucesso.`,
      unlinked: updatedProducts?.length ?? 0,
      products: updatedProducts ?? [],
      uncategorized_id: UNCATEGORIZED_ID,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro inesperado ao desvincular produtos:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
