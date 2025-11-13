import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { requireEditor, logActivity } from '@/lib/admin/auth'
import {
  createSectionSchema,
  fetchHomepageSectionById,
  fetchHomepageSections,
  generateSectionId,
  mapSectionRecord,
  sanitizeHref,
} from '@/lib/admin/homepage-sections'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

async function getAdminSupabaseClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createServiceClient()
  }
  return createClient()
}

export async function GET() {
  try {
    await requireEditor()
    const supabase = await getAdminSupabaseClient()
    const { data, error } = await fetchHomepageSections(supabase)

    if (error) {
      console.error('Erro ao listar seções da homepage:', error)
      return NextResponse.json({ error: 'Não foi possível carregar as seções.' }, { status: 500 })
    }

    const sections = (data ?? []).map(mapSectionRecord)
    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Erro inesperado ao listar seções:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireEditor()
    const body = await request.json()
    const parsed = createSectionSchema.parse(body)

    const supabase = await getAdminSupabaseClient()
    const generatedId = generateSectionId(parsed.id, parsed.title)

    const { data: existing } = await supabase
      .from('homepage_sections')
      .select('id')
      .eq('id', generatedId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe uma seção com este identificador.' },
        { status: 409 },
      )
    }

    const { data: lastSection } = await supabase
      .from('homepage_sections')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const payload = {
      id: generatedId,
      title: parsed.title.trim(),
      subtitle: parsed.subtitle?.trim() ?? null,
      layout_type: parsed.layout_type,
      bg_color: parsed.bg_color,
      limit: 3,
      view_all_label: parsed.view_all_label.trim(),
      view_all_href: sanitizeHref(parsed.view_all_href),
      category_id: parsed.category_id ?? null,
      sort_order: parsed.sort_order ?? ((lastSection?.sort_order ?? 0) + 1),
      is_active: parsed.is_active ?? true,
      config: parsed.config ?? {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }

    const { error: insertError } = await supabase.from('homepage_sections').insert(payload)
    if (insertError) {
      console.error('Erro ao criar seção:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    const { data: section, error: fetchError } = await fetchHomepageSectionById(
      supabase,
      generatedId,
    )

    if (fetchError || !section) {
      console.error('Erro ao carregar seção recém-criada:', fetchError)
      return NextResponse.json({ error: 'Seção criada, mas não foi possível retorná-la.' }, { status: 201 })
    }

    const response = mapSectionRecord(section)

    await logActivity(
      'homepage_section_created',
      'homepage_section',
      generatedId,
      undefined,
      response as unknown as Record<string, unknown>,
    )

    return NextResponse.json({ section: response }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    console.error('Erro inesperado ao criar seção:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
