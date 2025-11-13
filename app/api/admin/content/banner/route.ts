import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireEditor, logActivity } from '@/lib/admin/auth'
import { BANNER_SECTION_ID, DEFAULT_BANNER_CONTENT } from '@/lib/content'
import { createClient } from '@/lib/supabase/server'

const bannerSchema = z.object({
  enabled: z.boolean(),
  text: z.string().min(1, 'O texto do banner é obrigatório'),
  background_color: z.string().min(1),
  text_color: z.string().min(1),
  link: z.string().optional(),
  image_url: z.string().optional(),
  storage_path: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  banner_image_frameless: z.boolean().optional(),
})

export async function GET() {
  try {
    await requireEditor()

    const supabase = await createClient()
    const { data: banner, error } = await supabase
      .from('content_sections')
      .select('*')
      .eq('id', BANNER_SECTION_ID)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(DEFAULT_BANNER_CONTENT)
      }

      console.error('Erro ao buscar banner:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const payload = {
      id: banner?.id || DEFAULT_BANNER_CONTENT.id,
      enabled: banner?.active ?? DEFAULT_BANNER_CONTENT.enabled,
      text: banner?.data?.text || DEFAULT_BANNER_CONTENT.text,
      background_color: banner?.data?.background_color || DEFAULT_BANNER_CONTENT.background_color,
      text_color: banner?.data?.text_color || DEFAULT_BANNER_CONTENT.text_color,
      link: banner?.data?.link || DEFAULT_BANNER_CONTENT.link,
      image_url: banner?.image_url || banner?.data?.image_url || DEFAULT_BANNER_CONTENT.image_url,
      storage_path: banner?.storage_path || DEFAULT_BANNER_CONTENT.storage_path,
      title: banner?.title || DEFAULT_BANNER_CONTENT.title,
      description: banner?.description || DEFAULT_BANNER_CONTENT.description,
      banner_image_frameless:
        banner?.data?.banner_image_frameless ?? DEFAULT_BANNER_CONTENT.banner_image_frameless,
    }

    return NextResponse.json(payload)
  } catch (error: unknown) {
    console.error('Erro ao carregar banner:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao carregar banner'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await requireEditor()
    const body = await request.json()
    const validated = bannerSchema.parse(body)

    const supabase = await createClient()

    const { data: currentBanner } = await supabase
      .from('content_sections')
      .select('*')
      .eq('id', BANNER_SECTION_ID)
      .single()

    const contentData = {
      id: BANNER_SECTION_ID,
      type: 'banner' as const,
      title: validated.title || DEFAULT_BANNER_CONTENT.title,
      description: validated.description || DEFAULT_BANNER_CONTENT.description,
      image_url: validated.image_url || null,
      storage_path: validated.storage_path || null,
      data: {
        text: validated.text,
        background_color: validated.background_color,
        text_color: validated.text_color,
        link: validated.link,
        image_url: validated.image_url,
        banner_image_frameless:
          validated.banner_image_frameless ?? DEFAULT_BANNER_CONTENT.banner_image_frameless,
      },
      cta_link: validated.link,
      active: validated.enabled,
      sort_order: 10,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }

    let savedBanner
    if (currentBanner) {
      const { data, error } = await supabase
        .from('content_sections')
        .update(contentData)
        .eq('id', BANNER_SECTION_ID)
        .select()
        .single()

      if (error) throw error
      savedBanner = data
    } else {
      const { data, error } = await supabase
        .from('content_sections')
        .insert({
          ...contentData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      savedBanner = data
    }

    await logActivity(
      'content_updated',
      'content_section',
      BANNER_SECTION_ID,
      currentBanner,
      { ...validated, id: BANNER_SECTION_ID }
    )

    // Revalidar cache da homepage
    revalidatePath('/', 'page')

    return NextResponse.json(savedBanner)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao salvar banner:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao salvar banner'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
