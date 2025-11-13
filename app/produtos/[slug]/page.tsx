import { notFound } from 'next/navigation'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { mockProducts } from '@/lib/mock-data'
import { ProductCard } from '@/components/ui/ProductCard'
import type { Product } from '@/lib/types'

export const revalidate = 3600

async function getProduct(slug: string) {
  // Check if Supabase is configured
  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co'

  if (!hasSupabase) {
    // Return mock data for development
    return mockProducts.find(p => p.slug === slug) || null
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !product) {
      return mockProducts.find(p => p.slug === slug) || null
    }

    return product
  } catch (error) {
    console.error('Supabase error:', error)
    return mockProducts.find(p => p.slug === slug) || null
  }
}

async function getSimilarProducts(currentProduct: Product, limit: number = 3) {
  // Check if Supabase is configured
  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co'

  if (!hasSupabase) {
    // Return mock data for development
    return mockProducts
      .filter(p => p.id !== currentProduct.id && p.category === currentProduct.category)
      .slice(0, limit)
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', currentProduct.category)
      .neq('id', currentProduct.id)
      .limit(limit)

    if (error || !products || products.length === 0) {
      return mockProducts
        .filter(p => p.id !== currentProduct.id && p.category === currentProduct.category)
        .slice(0, limit)
    }

    return products
  } catch (error) {
    console.error('Supabase error:', error)
    return mockProducts
      .filter(p => p.id !== currentProduct.id && p.category === currentProduct.category)
      .slice(0, limit)
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return {
      title: 'Produto não encontrado',
    }
  }

  return {
    title: `${product.name} - Aquifaz`,
    description: product.description,
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  const similarProducts = await getSimilarProducts(product)

  const whatsappMessage = encodeURIComponent(
    `Olá! Tenho interesse no produto: ${product.name} - ${formatPrice(product.price)}. Gostaria de mais informações.`
  )

  return (
    <div className="min-h-screen bg-white dark:bg-black pt-24 sm:pt-32 pb-16 sm:pb-20">
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
          {/* Image */}
          {/* 
            IMAGEM DO PRODUTO
            - RESOLUÇÃO IDEAL: 1200x1200 pixels (1:1)
            - RESOLUÇÃO MÍNIMA: 800x800 pixels
            - FORMATO: JPG, PNG ou WEBP
            - TAMANHO: Máximo 500KB
          */}
          <div className="relative aspect-square bg-[#F5F5F5] dark:bg-[#1C1C1E] border border-[#D2D2D7] dark:border-[#38383A] rounded-lg overflow-hidden flex items-center justify-center">
            {(product.images && product.images.length > 0) || product.image_url ? (
              <Image
                src={
                  (product.images && product.images.length > 1 && product.images[1]) ||
                  (product.images && product.images[0]) ||
                  product.image_url ||
                  ''
                }
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="text-center">
                <p className="text-2xl font-semibold text-[#6E6E73] dark:text-[#98989D] mb-2">
                  1200 x 1200
                </p>
                <p className="text-base text-[#86868B] dark:text-[#636366]">
                  pixels
                </p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-6 sm:space-y-8">
            <div>
              <span className="inline-block px-2.5 sm:px-3 py-1 bg-[#F5F5F5] dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-white text-xs sm:text-sm font-medium rounded-lg mb-3 sm:mb-4">
                {product.category}
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#1D1D1F] dark:text-white leading-tight font-normal mb-3 sm:mb-4">
                {product.name}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-[#6E6E73] dark:text-[#98989D]">
                {product.description}
              </p>
            </div>

            <div className="border-t border-b border-[#D2D2D7] dark:border-[#38383A] py-4 sm:py-6">
              {/* Preço com desconto */}
              {product.original_price && product.original_price > product.price ? (
                <div className="space-y-2">
                  <p className="text-base text-[#86868B] dark:text-[#636366] line-through">
                    {formatPrice(product.original_price)}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl md:text-5xl font-[550] text-[#1D1D1F] dark:text-white">
                      {formatPrice(product.price)}
                      <span className="text-sm sm:text-base text-[#6E6E73] dark:text-[#98989D] ml-2">
                        /{product.unit || 'unidade'}
                      </span>
                    </span>
                    {product.discount_percent && (
                      <span className="inline-block text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">
                        {product.discount_percent}% OFF
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Economize {formatPrice((product.original_price ?? 0) - product.price)}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-[550] text-[#1D1D1F] dark:text-white">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-sm sm:text-base text-[#6E6E73] dark:text-[#98989D]">
                    /{product.unit || 'unidade'}
                  </span>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-[550] text-[#1D1D1F] dark:text-white">
                Características:
              </h3>
              <ul className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-[#6E6E73] dark:text-[#98989D]">
                <li>• Alta qualidade de impressão</li>
                <li>• Entrega rápida</li>
                <li>• Diversos tamanhos disponíveis</li>
                <li>• Acabamento profissional</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:gap-4">
              <a
                href={`https://wa.me/5563992731977?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Image
                  src="/Whatsapp.svg"
                  alt="Fazer Pedido via WhatsApp"
                  width={131}
                  height={31}
                  className="h-7 w-48 sm:h-7 sm:w-56 brightness-0 invert"
                  priority
                />
              </a>
              <p className="text-center text-xs sm:text-sm text-[#6E6E73] dark:text-[#98989D]">
                Fale conosco para fazer seu pedido personalizado
              </p>
            </div>

            {/* Additional Info */}
            <div className="bg-[#F5F5F5] dark:bg-[#1C1C1E] rounded-lg p-4 sm:p-6 space-y-2 sm:space-y-3">
              <h4 className="text-sm sm:text-base font-[550] text-[#1D1D1F] dark:text-white">
                Informações de Entrega
              </h4>
              <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#98989D]">
                Entrega em todo o Brasil. Prazo de produção: 3-7 dias úteis.
              </p>
            </div>
          </div>
        </div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="mt-16 sm:mt-20 md:mt-24">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-[550] text-[#1D1D1F] dark:text-white mb-2">
                Produtos Semelhantes
              </h2>
              <p className="text-sm sm:text-base text-[#6E6E73] dark:text-[#98989D]">
                Confira outras opções que podem te interessar
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {similarProducts.map((similarProduct) => (
                <ProductCard key={similarProduct.id} product={similarProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
