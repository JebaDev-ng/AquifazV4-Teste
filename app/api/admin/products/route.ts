import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireEditor, logActivity } from '@/lib/admin/auth'
import { z } from 'zod'

// Schema de validação para produto
const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
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
  unit: z.string().min(1, 'Unidade é obrigatória'),
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

// GET /api/admin/products - Listar produtos
export async function GET(request: NextRequest) {
  try {
    await requireEditor()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const excludeCategory = searchParams.get('exclude_category')
    const active = searchParams.get('active')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')

    const supabase = await createClient()
    
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('sort_order', { ascending: true })

    // Filtros
    if (category) {
      query = query.eq('category', category)
    }
    if (excludeCategory) {
      query = query.neq('category', excludeCategory)
    }
    if (active !== null) {
      query = query.eq('active', active === 'true')
    }
    if (featured !== null) {
      query = query.eq('featured', featured === 'true')
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%`)
    }

    // Paginação
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: products, error, count } = await query

    if (error) {
      console.error('Erro ao buscar produtos:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error: unknown) {
    console.error('Erro na API de produtos:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao listar produtos'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/admin/products - Criar produto
export async function POST(request: NextRequest) {
  try {
    await requireEditor()
    
    const body = await request.json()
    
    // Validar dados
    const validatedData = productSchema.parse(body)
    const { id, storage_path, ...productPayload } = validatedData
    
    // Gerar slug automaticamente
    const slug = validatedData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    const supabase = await createClient()
    
    // Verificar se o slug já existe
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Um produto com este nome já existe' }, 
        { status: 400 }
      )
    }

    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser()

    // Criar produto
    const { data, error } = await supabase
      .from('products')
      .insert({
        id,
        ...productPayload,
        slug,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
        storage_path: storage_path || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar produto:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log da atividade
    await logActivity('product_created', 'product', data.id, undefined, data)

    return NextResponse.json(data, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      logProductValidationIssues('POST /api/admin/products', error.issues)
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 422 },
      )
    }
    
    console.error('Erro na criação do produto:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao criar produto'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
