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

    return (data || []).filter((category) => category.active !== false)
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
    { label: 'Todos', value: undefined, accent_color: '#1D1D1F', image_url: undefined },
    ...categories.map((category) => ({
      label: category.name,
      value: category.id,
      accent_color: category.accent_color,
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
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8 md:mb-12">
          {categoryOptions.map((cat) => {
            const isActive = params.category === cat.value || (!cat.value && !params.category)
            const accentColor =
              cat.accent_color && /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(cat.accent_color)
                ? cat.accent_color
                : '#2d2736'

            return (
              <a
                key={cat.label}
                href={cat.value ? `/produtos?category=${cat.value}` : '/produtos'}
                className={`inline-flex items-center gap-2 justify-center h-9 sm:h-10 px-4 sm:px-5 text-xs sm:text-sm font-medium rounded-lg border transition-all duration-200 ${
                  isActive
                    ? 'text-white dark:text-[#1D1D1F]'
                    : 'bg-[#F5F5F5] dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-white hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E]'
                }`}
                style={isActive ? { backgroundColor: accentColor, borderColor: accentColor } : { borderColor: '#E5E5EA' }}
              >
                <span
                  className="relative inline-flex h-6 w-6 rounded-full overflow-hidden border"
                  style={{ borderColor: accentColor }}
                >
                  {cat.image_url ? (
                    <Image
                      src={cat.image_url}
                      alt={cat.label}
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="m-auto text-[8px] text-[#6E6E73] dark:text-[#98989D]">—</span>
                  )}
                </span>
                {cat.label}
              </a>
            )
          })}
        </div>

        {/* Products Grid - Padrão da Home */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {products.map((product) => (
              <div key={product.id}>
                <Link
                  href={`/produtos/${product.slug}`}
                  className="group block"
                >
                  {/* 
                    IMAGEM DO PRODUTO
                    - RESOLUÇÃO IDEAL: 600x800 pixels (3:4)
                    - FORMATO: JPG, PNG ou WEBP
                    - TAMANHO: Máximo 400KB
                  */}
                  <div className="relative aspect-[3/4] bg-[#F5F5F5] dark:bg-[#1C1C1E] border border-[#D2D2D7] dark:border-[#38383A] rounded-lg overflow-hidden mb-4 shadow-sm group-hover:shadow-md transition-shadow duration-300">
                    {/* Badge de desconto na imagem */}
                    {product.discount_percent && product.original_price && product.original_price > product.price && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="inline-block text-xs font-semibold text-white bg-green-600 px-3 py-1.5 rounded-lg shadow-md">
                          {product.discount_percent}% OFF
                        </span>
                      </div>
                    )}
                    
                    {/* Imagem do produto */}
                    {(product.images && product.images.length > 0) || product.image_url ? (
                      <Image
                        src={
                          (product.images && product.images[0]) ||
                          product.image_url ||
                          ''
                        }
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 45vw, (max-width: 1024px) 30vw, 20vw"
                        className="object-cover"
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

                  {/* Product Info */}
                  <div className="space-y-1 sm:space-y-2">
                    <h3 className="text-sm sm:text-base md:text-lg font-[550] text-[#1D1D1F] dark:text-white group-hover:text-[#6E6E73] dark:group-hover:text-[#98989D] transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="text-[#6E6E73] dark:text-[#98989D]">
                      <p className="text-xs sm:text-sm mb-0.5 sm:mb-1">A partir de</p>
                      
                      {/* Preço com desconto */}
                      {product.original_price && product.original_price > product.price ? (
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm text-[#86868B] dark:text-[#636366] line-through">
                            R$ {product.original_price.toFixed(2).replace('.', ',')}
                          </p>
                          <p className="text-base sm:text-lg md:text-xl font-[550] text-[#1D1D1F] dark:text-white">
                            R$ {product.price.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      ) : (
                        <p className="text-base sm:text-lg md:text-xl font-[550] text-[#1D1D1F] dark:text-white">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
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
