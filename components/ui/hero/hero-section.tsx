'use client'

import clsx from 'clsx'
import Image from 'next/image'
import { motion } from 'framer-motion'

import { fadeInUp, staggerContainer } from '@/lib/animations/variants'
import { DEFAULT_HERO_CONTENT, buildWhatsAppLink } from '@/lib/content'
import type { HeroContent } from '@/lib/types'

interface HeroSectionProps {
  content?: HeroContent
  className?: string
  layout?: 'default' | 'stacked' | 'preview'
  splitBreakpoint?: 'md' | 'lg'
}

export function HeroSection({
  content,
  className,
  layout = 'default',
  splitBreakpoint = 'lg',
}: HeroSectionProps) {
  const heroContent = { ...DEFAULT_HERO_CONTENT, ...content }
  const titleLines = heroContent.title.split('\n').filter(Boolean)
  const whatsappLink = buildWhatsAppLink(heroContent.whatsapp_number, heroContent.whatsapp_message)
  const promoImageUrl = heroContent.promo_image_url?.trim()
  const isFrameless = Boolean(heroContent.hero_image_frameless && promoImageUrl)

  const previewCardClasses = clsx(
    'block relative transition-shadow duration-300',
    isFrameless
      ? 'overflow-visible rounded-none shadow-none hover:shadow-none'
      : 'overflow-hidden rounded-lg shadow-sm hover:shadow-lg'
  )

  const previewImageContainerClasses = clsx(
    'relative aspect-[4/3] border border-[#D2D2D7] dark:border-[#38383A]',
    isFrameless ? 'bg-transparent dark:bg-transparent border-none rounded-none' : 'bg-[#F5F5F5] dark:bg-[#1C1C1E]'
  )

  if (layout === 'preview') {
    return (
      <section className={clsx('bg-white dark:bg-black pt-4 pb-4', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
          <div className="space-y-2.5">
            <div className="space-y-1.5 sm:space-y-2 text-left">
              <p className="text-xs font-normal text-[#6E6E73] dark:text-[#98989D] uppercase tracking-wider">
                {heroContent.subtitle}
              </p>
              <h1 className="text-xl sm:text-2xl text-[#1D1D1F] dark:text-white leading-tight font-normal">
                {titleLines.map((line, index) => (
                  <span key={`${line}-${index}`}>
                    {line}
                    {index < titleLines.length - 1 && <br />}
                  </span>
                ))}
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#98989D] text-left">
              {heroContent.description}
            </p>

            <div className="w-full sm:w-auto pt-1">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm"
              >
                <Image
                  src="/Whatsapp.svg"
                  alt="Fazer Pedido via WhatsApp"
                  width={131}
                  height={31}
                  className="h-5 w-32 brightness-0 invert"
                  priority
                />
              </a>
            </div>
          </div>

          <div className="w-full">
            <div className={previewCardClasses}>
              <div className={previewImageContainerClasses}>
                {promoImageUrl ? (
                  <Image
                    src={promoImageUrl}
                    alt={heroContent.promo_title || heroContent.title || 'Imagem promocional'}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority={layout === 'preview'}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                    <p className="text-xs sm:text-sm font-semibold text-[#6E6E73] dark:text-[#98989D] mb-1">
                      1200 x 900
                    </p>
                    <p className="text-xs text-[#86868B] dark:text-[#636366]">
                      pixels
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const gridClasses =
    layout === 'stacked'
      ? 'grid-cols-1 gap-6'
      : clsx(
          'grid-cols-1 gap-8 sm:gap-10',
          splitBreakpoint === 'md' ? 'md:grid-cols-2' : 'lg:grid-cols-2',
        )

  return (
    <section className={clsx('relative bg-white dark:bg-black pt-32 sm:pt-40 pb-12 sm:pb-16', className)}>
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 w-full">
        <div className={clsx('grid items-center', gridClasses)}>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-4 sm:space-y-6 md:space-y-8"
          >
            <motion.div variants={fadeInUp} className="space-y-3 sm:space-y-4 text-left">
              <p className="text-base sm:text-sm font-normal text-[#6E6E73] dark:text-[#98989D] uppercase tracking-wider">
                {heroContent.subtitle}
              </p>
              <h1 className="text-5xl sm:text-4xl md:text-5xl lg:text-6xl text-[#1D1D1F] dark:text-white leading-[0.95] font-normal">
                {titleLines.map((line, index) => (
                  <span key={`${line}-${index}`}>
                    {line}
                    {index < titleLines.length - 1 && <br />}
                  </span>
                ))}
              </h1>
            </motion.div>

            <motion.p
              variants={fadeInUp}
              className="text-xl sm:text-base md:text-lg text-[#6E6E73] dark:text-[#98989D] max-w-xl text-left"
            >
              {heroContent.description}
            </motion.p>

            <motion.div variants={fadeInUp} className="w-full sm:w-auto">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Image
                  src="/Whatsapp.svg"
                  alt="Fazer Pedido via WhatsApp"
                  width={131}
                  height={31}
                  className="h-7 w-48 sm:h-7 sm:w-54 brightness-0 invert"
                  priority
                />
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 lg:mt-0"
          >
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className={clsx(
                'block relative transition-shadow duration-300',
                isFrameless
                  ? 'overflow-visible rounded-none shadow-none hover:shadow-none'
                  : 'overflow-hidden rounded-lg shadow-sm hover:shadow-lg'
              )}
            >
              <div
                className={clsx(
                  'relative aspect-[4/3] border border-[#D2D2D7] dark:border-[#38383A]',
                  isFrameless
                    ? 'bg-transparent dark:bg-transparent border-none rounded-none'
                    : 'bg-[#F5F5F5] dark:bg-[#1C1C1E]'
                )}
              >
                {promoImageUrl ? (
                  <Image
                    src={promoImageUrl}
                    alt={heroContent.promo_title || heroContent.title || 'Imagem promocional'}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-6 sm:p-8 text-center">
                    <p className="text-sm sm:text-base font-semibold text-[#6E6E73] dark:text-[#98989D] mb-1">
                      1200 x 900
                    </p>
                    <p className="text-xs sm:text-sm text-[#86868B] dark:text-[#636366]">
                      pixels
                    </p>
                  </div>
                )}
              </div>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
