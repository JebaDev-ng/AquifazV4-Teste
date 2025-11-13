import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Por enquanto retorna dados mockados
    const products: unknown[] = []

    return NextResponse.json({ 
      products,
      total: products.length 
    })

  } catch {
    return NextResponse.json(
      { error: 'Erro ao carregar produtos' },
      { status: 500 }
    )
  }
}
