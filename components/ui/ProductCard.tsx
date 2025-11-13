import Link from 'next/link'
import type { Product } from '@/lib/types'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/produtos/${product.slug}`} className="group block">
      {/* 
        IMAGEM DO PRODUTO
        - RESOLUÇÃO IDEAL: 600x800 pixels (3:4)
        - FORMATO: JPG, PNG ou WEBP
        - TAMANHO: Máximo 400KB
      */}
      <div className="relative aspect-[3/4] bg-gray-card dark:bg-dark-primary border border-border-primary dark:border-dark-primary rounded-lg overflow-hidden mb-3 sm:mb-4 shadow-sm group-hover:shadow-md transition-shadow duration-300">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8 text-center">
          <p className="text-sm sm:text-base font-semibold text-[#6E6E73] dark:text-[#98989D]">
            600 x 800
          </p>
          <p className="text-xs sm:text-sm text-[#86868B] dark:text-[#636366] mt-1">
            pixels
          </p>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-1 sm:space-y-2">
        <h3 className="text-sm sm:text-base md:text-lg font-[550] text-[#1D1D1F] dark:text-white group-hover:text-[#6E6E73] dark:group-hover:text-[#98989D] transition-colors line-clamp-2">
          {product.name}
        </h3>
        <div className="text-[#6E6E73] dark:text-[#98989D]">
          <p className="text-xs sm:text-sm mb-0.5 sm:mb-1">A partir de</p>
          <p className="text-base sm:text-lg md:text-xl font-[550] text-[#1D1D1F] dark:text-white">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>
    </Link>
  )
}
