import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { ZodError } from 'zod'

import { requireEditor, logActivity } from '@/lib/admin/auth'
import {
  fetchHomepageSectionById,
  listSectionItemIds,
  reorderItemsSchema,
  saveSectionItemOrder,
} from '@/lib/admin/homepage-sections'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ sectionId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireEditor()
    const { sectionId } = await context.params
    const body = reorderItemsSchema.parse(await request.json())

    const supabase = await createClient()
    const { data: section, error } = await fetchHomepageSectionById(supabase, sectionId)

    if (error || !section) {
      return NextResponse.json({ error: 'Seção não encontrada.' }, { status: 404 })
    }

    const currentOrder = await listSectionItemIds(supabase, sectionId)
    if (currentOrder.length !== body.items.length) {
      return NextResponse.json(
        { error: 'Envie todos os itens para reordenar a seção.' },
        { status: 400 },
      )
    }

    const providedIds = new Set(body.items.map((entry) => entry.id))
    const missing = currentOrder.filter((id) => !providedIds.has(id))
    if (missing.length > 0) {
      return NextResponse.json(
        { error: 'A lista enviada não contém todos os itens atuais da seção.' },
        { status: 400 },
      )
    }

    const orderedIds = [...body.items]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((entry) => entry.id)

    await saveSectionItemOrder(supabase, orderedIds, user.id)

    await logActivity(
      'homepage_section_item_reordered',
      'homepage_section_item',
      sectionId,
      undefined,
      { orderedIds },
    )

    // Revalidar cache da homepage
    revalidatePath('/', 'page')

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    console.error('Erro inesperado ao reordenar itens da seção:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

