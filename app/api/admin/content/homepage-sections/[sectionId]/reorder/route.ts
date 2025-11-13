import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { requireEditor, logActivity } from '@/lib/admin/auth'
import { clampIndex, reorderSectionSchema } from '@/lib/admin/homepage-sections'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ sectionId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireEditor()
    const { sectionId } = await context.params
    const body = reorderSectionSchema.parse(await request.json())

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('homepage_sections')
      .select('id, sort_order')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Erro ao obter ordem atual das seções:', error)
      return NextResponse.json({ error: 'Não foi possível atualizar a ordem.' }, { status: 500 })
    }

    const currentOrder = data ?? []
    const exists = currentOrder.some((section) => section.id === sectionId)
    if (!exists) {
      return NextResponse.json({ error: 'Seção não encontrada.' }, { status: 404 })
    }

    const orderedIds = currentOrder
      .filter((section) => section.id !== sectionId)
      .map((section) => section.id)

    const targetIndex = clampIndex(body.sort_order - 1, orderedIds.length)
    orderedIds.splice(targetIndex, 0, sectionId)

    const now = new Date().toISOString()
    for (const [index, id] of orderedIds.entries()) {
      const { error: updateError } = await supabase
        .from('homepage_sections')
        .update({
          sort_order: index + 1,
          updated_at: now,
          updated_by: user.id,
        })
        .eq('id', id)

      if (updateError) {
        console.error('Erro ao atualizar ordem da seção:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }
    }

    await logActivity(
      'homepage_section_reordered',
      'homepage_section',
      sectionId,
      undefined,
      { sort_order: body.sort_order },
    )

    revalidatePath('/')

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    console.error('Erro inesperado ao reordenar seção:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
