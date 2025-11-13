'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import SingleImageUploader from '@/components/admin/ui/single-image-uploader'
import { HeroSection } from '@/components/ui/hero/hero-section'
import { LiquidToggle } from '@/components/admin/ui/liquid-toggle'
import {
  DEFAULT_HERO_CONTENT,
  HERO_SECTION_ID,
} from '@/lib/content'
import type { HeroContent } from '@/lib/types'
import type { UploadedImageMeta } from '@/lib/uploads'

const textareaClass =
  'w-full rounded-lg border border-[#D2D2D7] bg-white px-4 py-3 text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:border-[#007AFF] transition-colors'

export default function HeroContentPage() {
  const [heroContent, setHeroContent] = useState<HeroContent>(DEFAULT_HERO_CONTENT)
  const [promoImage, setPromoImage] = useState<UploadedImageMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadHero()
  }, [])

  const loadHero = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/content/hero')
      if (response.ok) {
        const payload = await response.json()
  setHeroContent({ ...DEFAULT_HERO_CONTENT, ...payload })
        setPromoImage(
          payload.promo_image_url
            ? { url: payload.promo_image_url, storagePath: payload.promo_storage_path || '' }
            : null,
        )
      }
    } catch (error) {
      console.error('Erro ao carregar hero:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveHero = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/content/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...heroContent,
          promo_image_url: heroContent.promo_image_url || undefined,
          promo_storage_path: heroContent.promo_storage_path || undefined,
          hero_image_frameless: Boolean(heroContent.hero_image_frameless),
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar hero')
      }
    } catch (error) {
      console.error('Erro ao salvar hero:', error)
      alert('Não foi possível salvar o hero. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] -m-6 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-10 w-1/3 rounded-lg bg-[#E5E5EA] animate-pulse mb-8" />
          <div className="h-64 rounded-2xl bg-[#F5F5F5] animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] -m-6 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <p className="text-sm text-[#6E6E73] mb-2">Conteúdo</p>
          <h1 className="text-4xl font-normal text-[#1D1D1F]">Hero Section</h1>
          <p className="text-[#6E6E73] mt-2 max-w-3xl">
            Configure título, descrição, CTA e destaque visual exibidos na abertura da homepage.
          </p>
        </header>

        {/* Layout: 2 colunas - Formulário + Preview */}
        <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-8 lg:items-start">
          {/* Coluna Esquerda: Formulário */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#6E6E73] mb-1">HERO PRINCIPAL</p>
                  <h2 className="text-lg font-medium text-[#1D1D1F]">Conteúdo da abertura</h2>
                </div>
                <Button onClick={saveHero} loading={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar hero'}
                </Button>
              </div>

              <div className="space-y-6">
                <Input
                  label="Subtítulo"
                  value={heroContent.subtitle}
                  onChange={(event) =>
                    setHeroContent((prev) => ({ ...prev, subtitle: event.target.value }))
                  }
                  placeholder="A sua gráfica em Araguaína"
                />
                
                <Input
                  label="Título principal"
                  value={heroContent.title}
                  onChange={(event) => setHeroContent((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Aquifaz trabalha com diversos serviços"
                />

                <div className="space-y-2">
                  <label className="block text-sm font-normal text-[#1D1D1F]">Descrição</label>
                  <textarea
                    rows={3}
                    className={textareaClass}
                    value={heroContent.description}
                    onChange={(event) =>
                      setHeroContent((prev) => ({ ...prev, description: event.target.value }))
                    }
                  />
                </div>

                <Input
                  label="WhatsApp (somente números)"
                  value={heroContent.whatsapp_number}
                  onChange={(event) =>
                    setHeroContent((prev) => ({ ...prev, whatsapp_number: event.target.value }))
                  }
                  placeholder="5563992731977"
                />

                <div className="space-y-2">
                  <label className="block text-sm font-normal text-[#1D1D1F]">Mensagem do WhatsApp</label>
                  <textarea
                    rows={2}
                    className={textareaClass}
                    value={heroContent.whatsapp_message}
                    onChange={(event) =>
                      setHeroContent((prev) => ({ ...prev, whatsapp_message: event.target.value }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-[#E5E5EA] bg-[#FBFBFB] px-4 py-3">
                  <div className="pr-4">
                    <p className="text-sm font-medium text-[#1D1D1F]">Imagem sem moldura</p>
                    <p className="text-xs text-[#6E6E73]">
                      Remove fundo e bordas do card quando usar imagens com transparência.
                    </p>
                  </div>
                  <LiquidToggle
                    checked={Boolean(heroContent.hero_image_frameless)}
                    onCheckedChange={(checked) =>
                      setHeroContent((prev) => ({ ...prev, hero_image_frameless: checked }))
                    }
                    aria-label="Ativar imagem sem moldura"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Preview + Imagem */}
          <aside className="hidden lg:block lg:relative mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* Card: Preview */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-[#E5E5EA] p-6"
              >
                <div className="mb-4">
                  <p className="text-xs text-[#6E6E73] uppercase tracking-wider mb-1">PREVIEW</p>
                  <h3 className="text-base font-medium text-[#1D1D1F]">Visual da homepage</h3>
                </div>

                <HeroSection
                  content={heroContent}
                  className="pt-0 pb-0"
                  layout="preview"
                />
              </motion.div>

              {/* Card: Imagem */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl border border-[#E5E5EA] p-6"
              >
                <div className="mb-4">
                  <p className="text-xs text-[#6E6E73] uppercase tracking-wider mb-1">GALERIA</p>
                  <h3 className="text-base font-medium text-[#1D1D1F]">Imagem promocional</h3>
                </div>
                
                <SingleImageUploader
                  image={promoImage}
                  onImageChange={(image) => {
                    setPromoImage(image)
                    setHeroContent((prev) => ({
                      ...prev,
                      promo_image_url: image?.url || '',
                      promo_storage_path: image?.storagePath || '',
                    }))
                  }}
                  entityId={HERO_SECTION_ID}
                  bucket="content_sections"
                  entity="hero"
                  helperText="Imagem exibida na hero section da homepage"
                  recommendedSize="1200×900px"
                />
              </motion.div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
