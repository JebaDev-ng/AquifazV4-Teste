import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { ZodError } from 'zod'

import { requireEditor, logActivity } from '@/lib/admin/auth'
import {
  addItemSchema,
  clampIndex,
  fetchHomepageSectionById,
  listSectionItemIds,
  mapSectionItemRecord,
  saveSectionItemOrder,
} from '@/lib/admin/homepage-sections'
import type { HomepageSectionItem } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ sectionId: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireEditor()
    const { sectionId } = await context.params
    const supabase = await createClient()

    const { data: section, error } = await fetchHomepageSectionById(supabase, sectionId)
    if (error || !section) {
      return NextResponse.json({ error: 'Seção não encontrada.' }, { status: 404 })
    }

    const items = Array.isArray(section.items)
      ? section.items
          .filter((item): item is Exclude<typeof item, null> => item !== null)
          .map(mapSectionItemRecord)
          .sort(
            (a: HomepageSectionItem, b: HomepageSectionItem) =>
              a.sort_order - b.sort_order || (a.created_at ?? '').localeCompare(b.created_at ?? ''),
          )
      : []

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Erro ao listar itens da seção:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireEditor()
    const { sectionId } = await context.params
    const body = await request.json()
    console.info('[homepage-sections] add item request', {
      sectionId,
      body,
    })
    const parsed = addItemSchema.parse(body)

    const supabase = await createClient()
    const { data: section, error: sectionError } = await fetchHomepageSectionById(
      supabase,
      sectionId,
    )

    if (sectionError || !section) {
      return NextResponse.json({ error: 'Seção não encontrada.' }, { status: 404 })
    }

    const { data: duplicate } = await supabase
      .from('homepage_section_items')
      .select('id')
      .eq('section_id', sectionId)
      .eq('product_id', parsed.product_id)
      .maybeSingle()

    if (duplicate) {
      return NextResponse.json(
        { error: 'Este produto já foi adicionado a esta seção.' },
        { status: 409 },
      )
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, slug, price, unit, image_url, category')
      .eq('id', parsed.product_id)
      .maybeSingle()

    if (productError || !product) {
      return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 })
    }

    if (!product.name || product.price === null || product.unit === null) {
      return NextResponse.json(
        { error: 'O produto precisa possuir nome, preço e unidade antes de ser adicionado.' },
        { status: 400 },
      )
    }

    const currentOrder = await listSectionItemIds(supabase, sectionId)
    const targetIndex = clampIndex((parsed.sort_order ?? currentOrder.length + 1) - 1, currentOrder.length)

    const { data: inserted, error: insertError } = await supabase
      .from('homepage_section_items')
      .insert({
        section_id: sectionId,
        product_id: parsed.product_id,
        sort_order: currentOrder.length + 1,
        metadata: parsed.metadata ?? {},
        updated_by: user.id,
      })
      .select(
        `
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
        `,
      )
      .single()

    if (insertError || !inserted) {
      console.error('Erro ao adicionar produto na seção:', {
        sectionId,
        payload: {
          section_id: sectionId,
          product_id: parsed.product_id,
        },
        insertError,
      })
      return NextResponse.json({ error: 'Não foi possível adicionar o produto.' }, { status: 400 })
    }

    const nextOrder = [...currentOrder]
    nextOrder.splice(targetIndex, 0, inserted.id)
    await saveSectionItemOrder(supabase, nextOrder, user.id)

    const { data: refreshed, error: refreshedError } = await supabase
      .from('homepage_section_items')
      .select(
        `
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
        `,
      )
      .eq('id', inserted.id)
      .maybeSingle()

    if (refreshedError || !refreshed) {
      return NextResponse.json({ error: 'Produto adicionado, mas não foi possível retorná-lo.' }, { status: 201 })
    }

    const response = mapSectionItemRecord(refreshed)

    await logActivity(
      'homepage_section_item_created',
      'homepage_section_item',
      inserted.id,
      undefined,
      response as unknown as Record<string, unknown>,
    )

    // Revalidar cache da homepage
    revalidatePath('/', 'page')

    return NextResponse.json({ item: response }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    console.error('Erro inesperado ao adicionar produto à seção:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
