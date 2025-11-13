import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params
    
    // Por enquanto retorna dados mockados
    const products: unknown[] = []

    return NextResponse.json({ 
      products,
      category,
      total: products.length 
    })

  } catch {
    return NextResponse.json(
      { error: 'Erro ao carregar produtos da categoria' },
      { status: 500 }
    )
  }
}
