import Link from 'next/link'
import Image from 'next/image'
import { mockProducts } from '@/lib/mock-data'
import { DEFAULT_PRODUCT_CATEGORIES } from '@/lib/content'
import type { ProductCategory } from '@/lib/types'

export const revalidate = 3600

interface SearchParams {
  category?: string
}

async function getProducts(category?: string) {
  if (!hasSupabaseConfigured) {
    // Return mock data for development
    if (category) {
      return mockProducts.filter(p => p.category === category)
    }
    return mockProducts
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: products, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return category ? mockProducts.filter(p => p.category === category) : mockProducts
    }

    return products || (category ? mockProducts.filter(p => p.category === category) : mockProducts)
  } catch (error) {
    console.error('Supabase error:', error)
    return category ? mockProducts.filter(p => p.category === category) : mockProducts
  }
}

async function getCategories(): Promise<ProductCategory[]> {
  if (!hasSupabaseConfigured) {
    return DEFAULT_PRODUCT_CATEGORIES
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      throw error
    }

    const sanitized = (data || []).filter(
      (category) => category.active !== false && category.id !== 'uncategorized',
    )
    return sanitized.length > 0 ? sanitized : DEFAULT_PRODUCT_CATEGORIES
  } catch (error) {
    console.error('Error fetching categories:', error)
    return DEFAULT_PRODUCT_CATEGORIES
  }
}

const hasSupabaseConfigured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co'

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const [products, categories] = await Promise.all([
    getProducts(params.category),
    getCategories(),
  ])

  const categoryOptions = [
    { label: 'Todos', value: undefined, image_url: undefined },
    ...categories.map((category) => ({
      label: category.name,
      value: category.id,
      image_url: category.image_url,
    })),
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-black pt-24 sm:pt-32 pb-16 sm:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#1D1D1F] dark:text-white leading-tight font-normal mb-2 sm:mb-3 md:mb-4">
            Nossos Produtos
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-[#6E6E73] dark:text-[#98989D]">
            Impressão de alta qualidade para todas as suas necessidades
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
          {categoryOptions.map((cat) => {
            const isActive = params.category === cat.value || (!cat.value && !params.category)
            return (
              <Link
                key={cat.label}
                href={cat.value ? `/produtos?category=${cat.value}` : '/produtos'}
                className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-[#2d2736] text-white'
                    : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {cat.label}
              </Link>
            )
          })}
        </div>

        {/* Products Grid - Padrão correto do projeto */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {products.map((product) => {
              const currency = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })
              const formattedPrice = currency.format(product.price ?? 0)
              const formattedOriginalPrice = product.original_price ? currency.format(product.original_price) : null
              const unit = product.unit || 'unidade'
              
              return (
                <Link
                  key={product.id}
                  href={`/produtos/${product.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[3/4] bg-gray-card dark:bg-dark-primary border border-border-primary dark:border-dark-primary rounded-lg overflow-hidden mb-4 shadow-sm group-hover:shadow-md transition-shadow duration-300">
                    {/* Badge de desconto na imagem */}
                    {product.discount_percent && product.original_price && product.original_price > product.price && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="inline-block text-xs font-semibold text-white bg-green-600 px-3 py-1.5 rounded-lg shadow-md">
                          {product.discount_percent}% OFF
                        </span>
                      </div>
                    )}
                    
                    {/* Imagem do produto */}
                    {((product.images && product.images.length > 0 && product.images[0]) || product.image_url) ? (
                      <Image
                        src={(product.images?.[0]) || product.image_url!}
                        alt={product.name}
                        width={600}
                        height={800}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                        <p className="text-base font-semibold text-[#6E6E73] dark:text-[#98989D]">
                          600 x 800
                        </p>
                        <p className="text-sm text-[#86868B] dark:text-[#636366] mt-1">
                          pixels
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-[450] text-[#1D1D1F] dark:text-white group-hover:text-[#6E6E73] dark:group-hover:text-[#98989D] transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="text-[#6E6E73] dark:text-[#98989D]">
                      <p className="text-sm mb-1">A partir de</p>
                      
                      {/* Preço com desconto */}
                      {product.original_price && product.original_price > product.price ? (
                        <div className="space-y-1">
                          <p className="text-sm text-[#86868B] dark:text-[#636366] line-through">
                            {formattedOriginalPrice}
                          </p>
                          <p className="text-xl font-[450] text-[#1D1D1F] dark:text-white">
                            {formattedPrice}
                            <span className="text-xs font-normal text-[#6E6E73] dark:text-[#98989D] ml-1">
                              / {unit}
                            </span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-xl font-[450] text-[#1D1D1F] dark:text-white">
                          {formattedPrice}
                          <span className="text-xs font-normal text-[#6E6E73] dark:text-[#98989D] ml-1">
                            / {unit}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-[#6E6E73] dark:text-[#98989D] text-lg">
              Nenhum produto encontrado nesta categoria.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
