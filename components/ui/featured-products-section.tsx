'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

import { fadeInUp, staggerContainer } from '@/lib/animations/variants'
import type { Product } from '@/lib/types'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

interface FeaturedProductsSectionProps {
  products?: Product[]
  title?: string
  subtitle?: string | null
  viewAllHref?: string
  viewAllLabel?: string
  bgColor?: 'white' | 'gray'
}

export function FeaturedProductsSection({
  products,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
  bgColor = 'white',
}: FeaturedProductsSectionProps) {
  const resolvedProducts = (products ?? []).slice(0, 3)

  if (!resolvedProducts.length) {
    return null
  }

  const resolvedTitle = title && title.trim().length > 0 ? title : 'Produtos em destaque'
  const resolvedSubtitle =
    subtitle && subtitle.trim().length > 0 ? subtitle : 'Confira nossos produtos mais populares'
  const resolvedViewAllHref = viewAllHref || '/produtos'
  const resolvedViewAllLabel = viewAllLabel || 'Ver todos'
  const showViewAll = Boolean(resolvedViewAllHref)

  return (
    <section className={bgColor === 'gray' ? 'py-12 sm:py-16 bg-gray-light dark:bg-black' : 'py-12 sm:py-16 bg-white dark:bg-black'}>
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="space-y-8"
        >
          <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-[450] text-[#1D1D1F] dark:text-white mb-2">
                {resolvedTitle}
              </h2>
              {resolvedSubtitle && (
                <p className="text-sm sm:text-base text-[#6E6E73] dark:text-[#98989D]">{resolvedSubtitle}</p>
              )}
            </div>
            {showViewAll && (
              <Link
                href={resolvedViewAllHref}
                className="text-[#1D1D1F] dark:text-white hover:text-[#6E6E73] dark:hover:text-[#98989D] transition-colors flex items-center gap-2"
              >
                <span className="hidden sm:inline">{resolvedViewAllLabel}</span>
                <span>&rarr;</span>
              </Link>
            )}
          </motion.div>

          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6"
          >
            {resolvedProducts.map((product) => {
              const href = `/produtos/${product.slug}`
              const formattedPrice = currency.format(product.price ?? 0)
              const unit = product.unit || 'unidade'

              return (
                <motion.div key={product.id} variants={fadeInUp}>
                  <Link href={href} className="group block">
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

                    <div className="space-y-1 sm:space-y-2">
                      <h3 className="text-sm sm:text-base md:text-lg font-[450] text-[#1D1D1F] dark:text-white group-hover:text-[#6E6E73] dark:group-hover:text-[#98989D] transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="text-[#6E6E73] dark:text-[#98989D]">
                        <p className="text-xs sm:text-sm mb-0.5 sm:mb-1">A partir de</p>
                        
                        {/* Preço com desconto */}
                        {product.original_price && product.original_price > product.price ? (
                          <div className="space-y-1">
                            <p className="text-xs sm:text-sm text-[#86868B] dark:text-[#636366] line-through">
                              {currency.format(product.original_price)}
                            </p>
                            <p className="text-base sm:text-lg md:text-xl font-[450] text-[#1D1D1F] dark:text-white">
                              {formattedPrice}
                              <span className="text-xs sm:text-sm font-normal text-[#6E6E73] dark:text-[#98989D] ml-1">
                                / {unit}
                              </span>
                            </p>
                          </div>
                        ) : (
                          <p className="text-base sm:text-lg md:text-xl font-[450] text-[#1D1D1F] dark:text-white">
                            {formattedPrice}
                            <span className="text-xs sm:text-sm font-normal text-[#6E6E73] dark:text-[#98989D] ml-1">
                              / {unit}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
