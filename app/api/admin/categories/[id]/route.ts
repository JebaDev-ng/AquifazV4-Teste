import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin, requireEditor, logActivity } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'
import { slugifyId } from '@/lib/content'

const imageSchema = z
  .string()
  .trim()
  .min(1)
  .optional()
  .refine(
    (value) => !value || value.startsWith('/') || /^https?:\/\//.test(value),
    'Informe uma URL completa (https://) ou um caminho relativo iniciando com /.'
  )

const hexColorRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/

const updateCategorySchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'Use apenas letras, números e hífens')
      .optional(),
    name: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().max(200).optional(),
    image_url: imageSchema,
    storage_path: z.string().optional(),
    accent_color: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || hexColorRegex.test(value), 'Informe uma cor no formato hex (#RRGGBB).'),
  sort_order: z.number().int().min(0).max(999).optional(),
    active: z.boolean().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Envie ao menos um campo para atualizar.',
  })

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  await requireEditor()
  const { id } = await context.params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
  }

  return NextResponse.json({ category: data })
}

export async function PUT(request: NextRequest, context: RouteContext) {
  await requireAdmin()

  try {
    const body = await request.json()
    const parsed = updateCategorySchema.parse(body)
    const { id: categoryId } = await context.params

    const supabase = await createClient()
    const { data: currentCategory } = await supabase
      .from('product_categories')
      .select('*')
      .eq('id', categoryId)
      .maybeSingle()

    if (!currentCategory) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    const nextId = parsed.id ? slugifyId(parsed.id) : categoryId
    const payload = {
      name: parsed.name ?? currentCategory.name,
      description: parsed.description ?? currentCategory.description,
      image_url: parsed.image_url ?? currentCategory.image_url,
      storage_path: parsed.storage_path ?? currentCategory.storage_path,
      accent_color: parsed.accent_color ?? currentCategory.accent_color,
      sort_order: parsed.sort_order ?? currentCategory.sort_order,
      active: parsed.active ?? currentCategory.active,
      updated_at: new Date().toISOString(),
    }
    const updatePayload = { ...payload, id: nextId }

    const { data, error } = await supabase
      .from('product_categories')
      .update(updatePayload)
      .eq('id', categoryId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar categoria:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (nextId !== categoryId) {
      await supabase
        .from('products')
        .update({ category: nextId })
        .eq('category', categoryId)
    }

    await logActivity(
      'category_updated',
      'product_category',
      nextId,
      currentCategory,
      updatePayload
    )

    return NextResponse.json({ category: { ...data, id: nextId } })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro inesperado ao atualizar categoria:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  await requireAdmin()
  const { id } = await context.params
  const supabase = await createClient()

  // Verificar se existe produto associado
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category', id)

  if (count && count > 0) {
    return NextResponse.json(
      {
        error: `Não é possível remover: existem ${count} produto(s) vinculado(s) a esta categoria. Use "Gerenciar produtos" para movê-los antes de excluir.`,
      },
      { status: 400 }
    )
  }

  const { data: deletedCategory } = await supabase
    .from('product_categories')
    .select('*')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('product_categories').delete().eq('id', id)

  if (error) {
    console.error('Erro ao remover categoria:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await logActivity('category_deleted', 'product_category', id, deletedCategory, undefined)

  return NextResponse.json({ deleted: true, id })
}
