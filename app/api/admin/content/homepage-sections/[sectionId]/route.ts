import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { requireEditor, logActivity } from '@/lib/admin/auth'
import {
  fetchHomepageSectionById,
  mapSectionRecord,
  sanitizeHref,
  updateSectionSchema,
} from '@/lib/admin/homepage-sections'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ sectionId: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireEditor()
    const { sectionId } = await context.params
    const supabase = await createClient()
    const { data, error } = await fetchHomepageSectionById(supabase, sectionId)

    if (error || !data) {
      return NextResponse.json({ error: 'Seção não encontrada.' }, { status: 404 })
    }

    return NextResponse.json({ section: mapSectionRecord(data) })
  } catch (error) {
    console.error('Erro ao buscar seção específica:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireEditor()
    const { sectionId } = await context.params
    const body = await request.json()
    const parsed = updateSectionSchema.parse(body)

    const supabase = await createClient()
    const { data: existing, error: fetchError } = await fetchHomepageSectionById(
      supabase,
      sectionId,
    )

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Seção não encontrada.' }, { status: 404 })
    }

    const updatePayload = {
      title: parsed.title.trim(),
      subtitle: parsed.subtitle?.trim() ?? null,
      layout_type: parsed.layout_type,
      bg_color: parsed.bg_color,
      limit: 3,
      view_all_label: parsed.view_all_label.trim(),
      view_all_href: sanitizeHref(parsed.view_all_href),
      category_id: parsed.category_id ?? null,
      sort_order: parsed.sort_order ?? existing.sort_order ?? 0,
      is_active: parsed.is_active ?? existing.is_active ?? true,
      config: parsed.config ?? {},
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }

    const { error: updateError } = await supabase
      .from('homepage_sections')
      .update(updatePayload)
      .eq('id', sectionId)

    if (updateError) {
      console.error('Erro ao atualizar seção:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    const { data: updated, error: reloadError } = await fetchHomepageSectionById(
      supabase,
      sectionId,
    )

    if (reloadError || !updated) {
      return NextResponse.json(
        { error: 'Seção atualizada, mas não foi possível carregá-la.' },
        { status: 200 },
      )
    }

    const previous = mapSectionRecord(existing)
    const response = mapSectionRecord(updated)

    await logActivity(
      'homepage_section_updated',
      'homepage_section',
      sectionId,
      previous as unknown as Record<string, unknown>,
      response as unknown as Record<string, unknown>,
    )

    revalidatePath('/')

    return NextResponse.json({ section: response })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    console.error('Erro inesperado ao atualizar seção:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireEditor()
    const { sectionId } = await context.params

    const supabase = await createClient()
    const { data: existing, error: fetchError } = await fetchHomepageSectionById(
      supabase,
      sectionId,
    )

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Seção não encontrada.' }, { status: 404 })
    }

    const previous = mapSectionRecord(existing)

    const { error: deleteError } = await supabase
      .from('homepage_sections')
      .delete()
      .eq('id', sectionId)

    if (deleteError) {
      console.error('Erro ao excluir seção:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    await logActivity(
      'homepage_section_deleted',
      'homepage_section',
      sectionId,
      previous as unknown as Record<string, unknown>,
      undefined,
    )

    revalidatePath('/')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro inesperado ao excluir seção:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
