import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireEditor, logActivity } from '@/lib/admin/auth'
import { DEFAULT_HERO_CONTENT, HERO_SECTION_ID } from '@/lib/content'
import { createClient } from '@/lib/supabase/server'

const heroContentSchema = z.object({
  subtitle: z.string().min(1, 'Subtítulo é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  whatsapp_number: z.string().min(1, 'Número do WhatsApp é obrigatório'),
  whatsapp_message: z.string().min(1, 'Mensagem do WhatsApp é obrigatória'),
  promo_image_url: z.string().optional(),
  promo_storage_path: z.string().optional(),
  promo_title: z.string().optional(),
  promo_subtitle: z.string().optional(),
  hero_image_frameless: z.boolean().optional(),
})

export async function GET() {
  try {
    await requireEditor()

    const supabase = await createClient()
    const { data: content, error } = await supabase
      .from('content_sections')
      .select('*')
      .eq('id', HERO_SECTION_ID)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(DEFAULT_HERO_CONTENT)
      }

      console.error('Erro ao buscar conteúdo do hero:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const heroData = {
      subtitle: content?.subtitle || DEFAULT_HERO_CONTENT.subtitle,
      title: content?.title || DEFAULT_HERO_CONTENT.title,
      description: content?.description || DEFAULT_HERO_CONTENT.description,
      promo_image_url: content?.image_url || DEFAULT_HERO_CONTENT.promo_image_url,
      promo_storage_path: content?.promo_storage_path || DEFAULT_HERO_CONTENT.promo_storage_path,
      promo_title: content?.data?.promo_title || DEFAULT_HERO_CONTENT.promo_title,
      promo_subtitle: content?.data?.promo_subtitle || DEFAULT_HERO_CONTENT.promo_subtitle,
      whatsapp_number: content?.data?.whatsapp_number || DEFAULT_HERO_CONTENT.whatsapp_number,
      whatsapp_message: content?.data?.whatsapp_message || DEFAULT_HERO_CONTENT.whatsapp_message,
      hero_image_frameless:
        content?.data?.hero_image_frameless ?? DEFAULT_HERO_CONTENT.hero_image_frameless,
    }

    return NextResponse.json(heroData)
  } catch (error: unknown) {
    console.error('Erro na API de conteúdo do hero:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao carregar o hero'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireEditor()
    const body = await request.json()
    const validatedData = heroContentSchema.parse(body)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: currentContent } = await supabase
      .from('content_sections')
      .select('*')
      .eq('id', HERO_SECTION_ID)
      .single()

    const contentData = {
      id: HERO_SECTION_ID,
      type: 'hero' as const,
      title: validatedData.title,
      subtitle: validatedData.subtitle,
      description: validatedData.description,
      image_url: validatedData.promo_image_url || null,
      promo_storage_path: validatedData.promo_storage_path || null,
      data: {
        whatsapp_number: validatedData.whatsapp_number,
        whatsapp_message: validatedData.whatsapp_message,
        promo_title: validatedData.promo_title,
        promo_subtitle: validatedData.promo_subtitle,
        hero_image_frameless: validatedData.hero_image_frameless ?? false,
      },
      active: true,
      sort_order: 0,
      updated_at: new Date().toISOString(),
      updated_by: user?.id,
    }

    let upserted
    if (currentContent) {
      const { data, error } = await supabase
        .from('content_sections')
        .update(contentData)
        .eq('id', HERO_SECTION_ID)
        .select()
        .single()

      if (error) throw error
      upserted = data
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
      upserted = data
    }

    await logActivity(
      'content_updated',
      'content_section',
      HERO_SECTION_ID,
      currentContent,
      { ...validatedData, id: HERO_SECTION_ID }
    )

    // Revalidar cache da homepage
    revalidatePath('/', 'page')

    return NextResponse.json(upserted)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro na atualização do conteúdo do hero:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao salvar o hero'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
