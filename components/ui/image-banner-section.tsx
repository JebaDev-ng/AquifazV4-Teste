'use client'

import clsx from 'clsx'
import Image from 'next/image'
import { motion } from 'framer-motion'

import { DEFAULT_BANNER_CONTENT } from '@/lib/content'
import type { BannerContent } from '@/lib/types'

interface ImageBannerSectionProps {
  banner?: BannerContent | null
  href?: string
}

interface BannerVisualProps {
  hasImage: boolean
  imageUrl?: string
  headline: string
  description: string
  wrapperClasses: string
  imageContainerClasses: string
}

const BannerVisual = ({ hasImage, imageUrl, headline, description, wrapperClasses, imageContainerClasses }: BannerVisualProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className={wrapperClasses}
  >
    {hasImage ? (
      <div className={imageContainerClasses}>
        <Image
          src={imageUrl!}
          alt={headline}
          fill
          sizes="(max-width: 768px) 100vw, 80vw"
          className="object-cover"
          priority={false}
        />
      </div>
    ) : (
      <div className={imageContainerClasses}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <div className="text-[#86868B] mb-3">
            <svg
              className="w-20 h-20 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-[#1D1D1F] font-[550] text-base sm:text-xl mb-2">
            {headline}
          </p>
          <p className="text-[#6E6E73] font-semibold text-sm sm:text-lg mb-1">
            1920 × 500 pixels
          </p>
          <p className="text-[#86868B] text-xs sm:text-sm">
            {description}
          </p>
          <p className="text-[#86868B] text-[10px] sm:text-xs mt-3 sm:mt-4">
            Formatos: JPG, PNG, WEBP • Máx: 3MB
          </p>
          <p className="text-[#86868B] text-[10px] sm:text-xs mt-1 sm:mt-2">
            Mínimo: 1600×400px para manter qualidade
          </p>
        </div>
      </div>
    )}
  </motion.div>
)

export function ImageBannerSection({
  banner = DEFAULT_BANNER_CONTENT,
  href,
}: ImageBannerSectionProps) {
  const resolvedBanner = banner || DEFAULT_BANNER_CONTENT
  const imageUrl = resolvedBanner.image_url?.trim()
  const hasImage = Boolean(imageUrl)
  const isFrameless = Boolean(hasImage && resolvedBanner.banner_image_frameless)
  
  if (!resolvedBanner.enabled) {
    return null
  }

  const destination = href || resolvedBanner.link
  const headline = resolvedBanner.title || 'Banner Promocional'
  const description = resolvedBanner.description || 'Resolução ideal para banner full-width'

  const wrapperClasses = clsx(
    'transition-shadow duration-300',
    isFrameless ? 'overflow-visible rounded-none shadow-none' : 'overflow-hidden rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md'
  )
  const imageContainerClasses = clsx(
    'relative w-full aspect-[16/9] sm:aspect-[21/7] md:aspect-[21/6] border border-border-primary bg-gray-card',
    isFrameless ? 'bg-transparent border-none rounded-none' : undefined
  )



  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
        {destination ? (
          <a
            href={destination}
            target={destination.startsWith('http') ? '_blank' : undefined}
            rel={destination.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="block transition-transform hover:scale-[1.02] duration-300"
          >
            <BannerVisual 
              hasImage={hasImage}
              imageUrl={imageUrl}
              headline={headline}
              description={description}
              wrapperClasses={wrapperClasses}
              imageContainerClasses={imageContainerClasses}
            />
          </a>
        ) : (
          <BannerVisual 
            hasImage={hasImage}
            imageUrl={imageUrl}
            headline={headline}
            description={description}
            wrapperClasses={wrapperClasses}
            imageContainerClasses={imageContainerClasses}
          />
        )}
      </div>
    </section>
  )
}
