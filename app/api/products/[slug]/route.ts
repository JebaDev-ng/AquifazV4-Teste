import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await params
    
    // Por enquanto retorna dados mockados
    const product = null

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ product })

  } catch {
    return NextResponse.json(
      { error: 'Erro ao carregar produto' },
      { status: 500 }
    )
  }
}
