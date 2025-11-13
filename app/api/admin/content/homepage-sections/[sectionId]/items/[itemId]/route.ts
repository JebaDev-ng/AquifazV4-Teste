import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { ZodError } from 'zod'

import { requireEditor, logActivity } from '@/lib/admin/auth'
import {
  clampIndex,
  listSectionItemIds,
  mapSectionItemRecord,
  saveSectionItemOrder,
  updateItemSchema,
} from '@/lib/admin/homepage-sections'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ sectionId: string; itemId: string }>
}

const itemSelect = `
  *,
  product:products(
    id,
    name,
    slug,
    price,
    unit,
    image_url,
    category
  )
`

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireEditor()
    const { sectionId, itemId } = await context.params
    const body = await request.json()
    const parsed = updateItemSchema.parse(body)

    const supabase = await createClient()
    const { data: currentItem, error } = await supabase
      .from('homepage_section_items')
      .select(itemSelect)
      .eq('section_id', sectionId)
      .eq('id', itemId)
      .maybeSingle()

    if (error || !currentItem) {
      return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 })
    }

    const previous = mapSectionItemRecord(currentItem)
    const updates: Record<string, unknown> = {}
    if (parsed.metadata) {
      updates.metadata = parsed.metadata
    }
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString()
      updates.updated_by = user.id
      const { error: updateError } = await supabase
        .from('homepage_section_items')
        .update(updates)
        .eq('id', itemId)
      if (updateError) {
        console.error('Erro ao atualizar metadata do item:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }
    }

    if (parsed.sort_order !== undefined) {
      const currentOrder = await listSectionItemIds(supabase, sectionId)
      if (!currentOrder.includes(itemId)) {
        return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 })
      }
      const filtered = currentOrder.filter((id) => id !== itemId)
      const targetIndex = clampIndex(parsed.sort_order - 1, filtered.length)
      filtered.splice(targetIndex, 0, itemId)
      await saveSectionItemOrder(supabase, filtered, user.id)
    }

    const { data: refreshed, error: refreshedError } = await supabase
      .from('homepage_section_items')
      .select(itemSelect)
      .eq('id', itemId)
      .maybeSingle()

    if (refreshedError || !refreshed) {
      return NextResponse.json(
        { error: 'Item atualizado, mas não foi possível retorná-lo.' },
        { status: 200 },
      )
    }

    const response = mapSectionItemRecord(refreshed)
    await logActivity(
      'homepage_section_item_updated',
      'homepage_section_item',
      itemId,
      previous as unknown as Record<string, unknown>,
      response as unknown as Record<string, unknown>,
    )

    // Revalidar cache da homepage
    revalidatePath('/', 'page')

    return NextResponse.json({ item: response })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    console.error('Erro inesperado ao atualizar item da seção:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireEditor()
    const { sectionId, itemId } = await context.params
    const supabase = await createClient()

    const { data: existing, error } = await supabase
      .from('homepage_section_items')
      .select(itemSelect)
      .eq('section_id', sectionId)
      .eq('id', itemId)
      .maybeSingle()

    if (error || !existing) {
      return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 })
    }

    const previous = mapSectionItemRecord(existing)
    const { error: deleteError } = await supabase
      .from('homepage_section_items')
      .delete()
      .eq('section_id', sectionId)
      .eq('id', itemId)

    if (deleteError) {
      console.error('Erro ao excluir item da seção:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    const currentOrder = await listSectionItemIds(supabase, sectionId)
    await saveSectionItemOrder(supabase, currentOrder, user.id)

    await logActivity(
      'homepage_section_item_deleted',
      'homepage_section_item',
      itemId,
      previous as unknown as Record<string, unknown>,
      undefined,
    )

    // Revalidar cache da homepage
    revalidatePath('/', 'page')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro inesperado ao excluir item da seção:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

