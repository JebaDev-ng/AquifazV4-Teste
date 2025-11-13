'use client'

import clsx from 'clsx'
import Image from 'next/image'
import { useEffect, useState } from 'react'

import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import MediaPicker from '@/components/admin/ui/media-picker'
import { LiquidToggle } from '@/components/admin/ui/liquid-toggle'
import { DEFAULT_BANNER_CONTENT, BANNER_SECTION_ID } from '@/lib/content'
import type { BannerContent } from '@/lib/types'
import type { UploadedImageMeta } from '@/lib/uploads'

const textareaClass =
  'w-full rounded-lg border border-[#D2D2D7] bg-white px-4 py-3 text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:border-[#007AFF] transition-colors'

export default function BannerContentPage() {
  const [bannerContent, setBannerContent] = useState<BannerContent>(DEFAULT_BANNER_CONTENT)
  const [bannerImage, setBannerImage] = useState<UploadedImageMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadBanner()
  }, [])

  const loadBanner = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/content/banner')
      if (response.ok) {
        const payload = await response.json()
        setBannerContent({ ...DEFAULT_BANNER_CONTENT, ...payload })
        setBannerImage(
          payload.image_url
            ? { url: payload.image_url, storagePath: payload.storage_path || '', bucket: 'banners' }
            : null,
        )
      }
    } catch (error) {
      console.error('Erro ao carregar banner:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveBanner = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/content/banner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bannerContent,
          image_url: bannerContent.image_url || undefined,
          storage_path: bannerContent.storage_path || undefined,
          banner_image_frameless: Boolean(bannerContent.banner_image_frameless),
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar banner')
      }
    } catch (error) {
      console.error('Erro ao salvar banner:', error)
      alert('Não foi possível salvar o banner. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] -m-6 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-10 w-1/3 rounded-lg bg-[#E5E5EA] animate-pulse" />
          <div className="h-64 rounded-2xl bg-[#F5F5F5] animate-pulse" />
        </div>
      </div>
    )
  }

  const previewUrl = bannerImage?.url || bannerContent.image_url || ''
  const isFrameless = Boolean(bannerContent.banner_image_frameless && previewUrl)
  const previewWrapperClasses = clsx(
    'block relative transition-shadow duration-300',
    isFrameless ? 'overflow-visible rounded-none shadow-none' : 'overflow-hidden rounded-2xl shadow-sm'
  )
  const previewContainerClasses = clsx(
    'relative aspect-[21/9] border border-[#D2D2D7] rounded-2xl bg-[#F5F5F5]',
    isFrameless ? 'bg-transparent border-none rounded-none' : undefined
  )

  return (
    <div className="min-h-screen bg-[#FAFAFA] -m-6 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <p className="text-sm text-[#6E6E73] mb-2">Conteúdo</p>
          <h1 className="text-4xl font-normal text-[#1D1D1F]">Banners</h1>
          <p className="text-[#6E6E73] mt-2 max-w-3xl">
            Configure a faixa promocional exibida no meio da homepage com título, descrição, link e imagem completa.
          </p>
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] lg:gap-8 lg:items-start">
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-[#E5E5EA] p-8 space-y-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#6E6E73] mb-1">Banner promocional</p>
                  <h2 className="text-lg font-medium text-[#1D1D1F]">Faixa intermediária</h2>
                </div>
                <Button onClick={saveBanner} loading={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar banner'}
                </Button>
              </div>

              <div className="space-y-6">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#D2D2D7] text-[#007AFF] focus:ring-[#007AFF]"
                    checked={bannerContent.enabled}
                    onChange={(event) =>
                      setBannerContent((prev) => ({ ...prev, enabled: event.target.checked }))
                    }
                  />
                  <span className="text-sm text-[#1D1D1F]">Exibir banner na homepage</span>
                </label>

                <Input
                  label="Título"
                  value={bannerContent.title || ''}
                  onChange={(event) =>
                    setBannerContent((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Solicite um orçamento rápido"
                />

                <div className="space-y-2">
                  <label className="text-sm text-[#1D1D1F]">Descrição curta</label>
                  <textarea
                    rows={2}
                    className={textareaClass}
                    value={bannerContent.description || ''}
                    onChange={(event) =>
                      setBannerContent((prev) => ({ ...prev, description: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[#1D1D1F]">Texto principal</label>
                  <textarea
                    rows={3}
                    className={textareaClass}
                    value={bannerContent.text}
                    onChange={(event) =>
                      setBannerContent((prev) => ({ ...prev, text: event.target.value }))
                    }
                  />
                </div>

                <Input
                  label="Link do banner"
                  value={bannerContent.link || ''}
                  onChange={(event) =>
                    setBannerContent((prev) => ({ ...prev, link: event.target.value }))
                  }
                  placeholder="https://wa.me/..."
                />

                <div className="flex items-center justify-between rounded-lg border border-[#E5E5EA] bg-[#FBFBFB] px-4 py-3">
                  <div className="pr-4">
                    <p className="text-sm font-medium text-[#1D1D1F]">Imagem sem moldura</p>
                    <p className="text-xs text-[#6E6E73]">
                      Remove moldura quando o banner tiver fundo transparente.
                    </p>
                  </div>
                  <LiquidToggle
                    checked={Boolean(bannerContent.banner_image_frameless)}
                    onCheckedChange={(checked) =>
                      setBannerContent((prev) => ({ ...prev, banner_image_frameless: checked }))
                    }
                    aria-label="Ativar modo imagem pura"
                  />
                </div>
              </div>
            </div>
          </div>

          <aside className="mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-8 space-y-6">
              <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#6E6E73]">Preview</p>
                  <h3 className="text-base font-medium text-[#1D1D1F]">Banner intermediário</h3>
                </div>

                {bannerContent.enabled ? (
                  <div className={previewWrapperClasses}>
                    <div className={previewContainerClasses}>
                      {previewUrl ? (
                        <Image
                          fill
                          src={previewUrl}
                          alt={bannerContent.title || 'Prévia do banner'}
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 600px"
                          priority={false}
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-center p-6">
                          <p className="text-sm font-semibold text-[#6E6E73] mb-1">1920 x 500</p>
                          <p className="text-xs text-[#86868B]">pixels</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-[#D2D2D7] p-10 text-center text-sm text-[#6E6E73]">
                    Banner desativado
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E5EA] p-6">
                <MediaPicker
                  label="Imagem do banner"
                  value={bannerImage}
                  onChange={(image) => {
                    setBannerImage(image)
                    setBannerContent((prev) => ({
                      ...prev,
                      image_url: image?.url || '',
                      storage_path: image?.storagePath || '',
                    }))
                  }}
                  bucket="banners"
                  entity="banner"
                  entityId={BANNER_SECTION_ID}
                  prefix={`banners/${BANNER_SECTION_ID}`}
                  fileRole="banner_image"
                  helperText="Imagem exibida na faixa promocional da homepage"
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
