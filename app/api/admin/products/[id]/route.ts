import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireEditor, requireAdmin, logActivity } from '@/lib/admin/auth'
import { z } from 'zod'

const productUpdateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  description: z.string().min(1, 'Descrição é obrigatória').optional(),
  category: z.string().min(1, 'Categoria é obrigatória').optional(),
  price: z.number().min(0.01, 'Preço deve ser maior que zero').optional(),
  original_price: z.number().optional().nullable(),
  discount_percent: z.number().min(0).max(90).optional().nullable(),
  image_url: z.string().optional(),
  storage_path: z.string().optional(),
  images: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  show_on_home: z.boolean().optional(),
  show_on_featured: z.boolean().optional(),
  discount_price: z.number().optional(),
  discount_start: z.string().optional(),
  discount_end: z.string().optional(),
  specifications: z.record(z.string(), z.any()).optional(),
  min_quantity: z.number().optional(),
  max_quantity: z.number().optional(),
  unit: z.string().min(1, 'Unidade é obrigatória').optional(),
  tags: z.array(z.string()).optional(),
  meta_description: z.string().optional(),
  sort_order: z.number().optional(),
})

function logProductValidationIssues(context: string, issues: z.ZodIssue[]) {
  const fields = Array.from(
    new Set(
      issues
        .map((issue) => (Array.isArray(issue.path) && issue.path.length ? String(issue.path[0]) : null))
        .filter((value): value is string => Boolean(value)),
    ),
  )

  if (fields.length) {
    console.warn(`[admin/products] payload rejeitado (${context})`, {
      missingFields: fields,
    })
  } else {
    console.warn(`[admin/products] payload rejeitado (${context}) sem campos identificados`)
  }
}

// GET /api/admin/products/[id] - Obter produto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireEditor()
    
    const supabase = await createClient()
    const { id } = await params
    
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
      }
      console.error('Erro ao buscar produto:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(product)
  } catch (error: unknown) {
    console.error('Erro na API de produto:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao carregar produto'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT /api/admin/products/[id] - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireEditor()
    
    const body = await request.json()
    const { id } = await params
    
    // Validar dados
    const validatedData = productUpdateSchema.parse(body)
    
    const supabase = await createClient()
    
    // Buscar produto atual para log
    const { data: currentProduct } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (!currentProduct) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Gerar novo slug se o nome foi alterado
    let slug = currentProduct.slug
    if (validatedData.name && validatedData.name !== currentProduct.name) {
      slug = validatedData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      // Verificar se o novo slug já existe
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single()

      if (existingProduct) {
        return NextResponse.json(
          { error: 'Um produto com este nome já existe' }, 
          { status: 400 }
        )
      }
    }

    const mergedProduct = {
      ...currentProduct,
      ...validatedData,
      slug,
    }

    const missingFields: string[] = []
    const hasName = typeof mergedProduct.name === 'string' && mergedProduct.name.trim().length > 0
    if (!hasName) {
      missingFields.push('name')
    }
    const hasUnit = typeof mergedProduct.unit === 'string' && mergedProduct.unit.trim().length > 0
    if (!hasUnit) {
      missingFields.push('unit')
    }
    const hasPrice = typeof mergedProduct.price === 'number' && mergedProduct.price > 0
    if (!hasPrice) {
      missingFields.push('price')
    }

    if (missingFields.length > 0) {
      console.warn('[admin/products] payload rejeitado (PUT /api/admin/products/:id)', {
        missingFields,
        reason: 'Campos obrigatórios ausentes após merge',
      })
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: missingFields.map((field) => ({ path: [field], message: 'Campo obrigatório' })),
        },
        { status: 422 },
      )
    }

    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser()

    // Atualizar produto
    const { data, error } = await supabase
      .from('products')
      .update({
        ...validatedData,
        slug,
        storage_path: validatedData.storage_path ?? currentProduct.storage_path,
        updated_at: new Date().toISOString(),
        updated_by: user?.id
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar produto:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log da atividade
    await logActivity('product_updated', 'product', data.id, currentProduct, data)

    return NextResponse.json(data)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      logProductValidationIssues('PUT /api/admin/products/:id', error.issues)
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 422 },
      )
    }
    
    console.error('Erro na atualização do produto:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao atualizar produto'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/admin/products/[id] - Deletar produto (apenas admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin() // Apenas admins podem deletar
    
    const supabase = await createClient()
    const { id } = await params
    
    // Buscar produto antes de deletar para log
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Deletar produto
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar produto:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log da atividade
    await logActivity('product_deleted', 'product', id, product, undefined)

    return NextResponse.json({ message: 'Produto deletado com sucesso' })
  } catch (error: unknown) {
    console.error('Erro na deleção do produto:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao deletar produto'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
