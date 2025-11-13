"use client"

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Modal } from '@/components/admin/ui/modal'

export type MediaPickerValue = {
  url: string
  storagePath: string
  bucket?: string
  reused?: boolean
  checksum?: string
  width?: number
  height?: number
  mime_type?: string
}

interface MediaPickerProps {
  value: MediaPickerValue | null
  onChange: (value: MediaPickerValue | null) => void
  bucket: string
  entity: string
  entityId?: string
  label?: string
  helperText?: string
  maxSizeMb?: number
  allowedMimeTypes?: string[]
}

type GalleryItem = {
  url: string
  storage_path: string
  bucket: string
  checksum?: string
  width?: number
  height?: number
  mime_type?: string
}

export default function MediaPicker({
  value,
  onChange,
  bucket,
  entity,
  entityId,
  label = 'Imagem',
  helperText,
  maxSizeMb = 5,
  allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
}: MediaPickerProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [filter, setFilter] = useState('')

  const prefix = useMemo(() => {
    const id = (entityId || 'temp').trim() || 'temp'
    return `${entity}/${id}/`
  }, [entity, entityId])

  const filteredGallery = useMemo(() => {
    if (!filter.trim()) return gallery
    const q = filter.trim().toLowerCase()
    return gallery.filter((g) => g.storage_path.toLowerCase().includes(q))
  }, [filter, gallery])

  const loadGallery = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const url = new URL('/api/admin/upload/gallery', window.location.origin)
      url.searchParams.set('bucket', bucket)
      url.searchParams.set('prefix', prefix)
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Falha ao carregar galeria')
      const data = await res.json()
      const items: GalleryItem[] = Array.isArray(data?.items) ? data.items : (data?.images ?? [])
      setGallery(items || [])
    } catch (err) {
      console.error(err)
      setError('Não foi possível carregar a galeria.')
    } finally {
      setIsLoading(false)
    }
  }, [bucket, prefix])

  useEffect(() => {
    if (open && activeTab === 'gallery') {
      void loadGallery()
    }
  }, [open, activeTab, loadGallery])

  const handleSelect = (item: GalleryItem) => {
    onChange({
      url: item.url,
      storagePath: item.storage_path,
      bucket: item.bucket,
      reused: true,
      checksum: item.checksum,
      width: item.width,
      height: item.height,
      mime_type: item.mime_type,
    })
    setOpen(false)
  }

  const handleUpload = async () => {
    if (!file) return
    setIsLoading(true)
    setError(null)
    try {
      if (!allowedMimeTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não permitido')
      }
      const sizeMb = file.size / (1024 * 1024)
      if (sizeMb > maxSizeMb) {
        throw new Error(`Arquivo excede ${maxSizeMb} MB`)
      }

      const form = new FormData()
      form.append('file', file)
      form.append('bucket', bucket)
      form.append('entity', entity)
      form.append('entity_id', entityId || 'temp')
      form.append('prefix', prefix)

      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Falha no upload')
      }
      const uploaded = await res.json()
      const url = uploaded?.url || uploaded?.publicUrl || uploaded?.public_url
      const storagePath = uploaded?.storagePath || uploaded?.storage_path

      if (!url || !storagePath) {
        throw new Error('Resposta de upload incompleta')
      }

      onChange({
        url,
        storagePath,
        bucket: uploaded?.bucket || bucket,
        reused: Boolean(uploaded?.reused),
        checksum: uploaded?.checksum,
        width: uploaded?.width,
        height: uploaded?.height,
        mime_type: uploaded?.mime_type,
      })
      setOpen(false)
      setFile(null)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Erro inesperado no upload')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-sm text-[#1D1D1F]">{label}</label>}

      <div className="flex items-center gap-3">
        {value?.url ? (
          <div className="relative h-14 w-14 rounded-lg border border-[#E5E5EA] overflow-hidden">
            <Image
              src={value.url}
              alt="Preview"
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-14 w-14 rounded-lg bg-[#F5F5F7] border border-[#E5E5EA]" />
        )}
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          {value?.url ? 'Trocar imagem' : 'Selecionar imagem'}
        </Button>
        {value?.url && (
          <Button type="button" variant="ghost" onClick={() => onChange(null)}>
            Remover
          </Button>
        )}
      </div>

      {helperText && <p className="text-xs text-[#6E6E73]">{helperText}</p>}

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Biblioteca de mídia" size="xl">
        <div className="flex items-center gap-4 border-b border-[#F2F2F7] pb-3 mb-4">
          <Button
            type="button"
            variant={activeTab === 'gallery' ? 'secondary' : 'ghost'}
            onClick={() => setActiveTab('gallery')}
          >
            Galeria
          </Button>
          <Button
            type="button"
            variant={activeTab === 'upload' ? 'secondary' : 'ghost'}
            onClick={() => setActiveTab('upload')}
          >
            Novo upload
          </Button>
          <div className="ml-auto text-xs text-[#6E6E73]">
            bucket: <span className="font-mono">{bucket}</span> • prefix:{' '}
            <span className="font-mono">{prefix}</span>
          </div>
        </div>

        {activeTab === 'gallery' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Filtrar por caminho"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <Button type="button" variant="ghost" onClick={() => void loadGallery()} loading={isLoading}>
                Recarregar
              </Button>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredGallery.map((item) => (
                <button
                  key={item.storage_path}
                  className="group relative rounded-lg overflow-hidden border border-[#E5E5EA] hover:shadow"
                  onClick={() => handleSelect(item)}
                >
                  <div className="relative w-full h-28">
                    <Image
                      src={item.url}
                      alt={item.storage_path}
                      fill
                      sizes="(max-width: 768px) 33vw, 20vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate">
                    {item.storage_path}
                  </div>
                </button>
              ))}
              {!isLoading && filteredGallery.length === 0 && (
                <p className="text-sm text-[#6E6E73]">Nenhuma mídia encontrada.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <input
              type="file"
              accept={allowedMimeTypes.join(',')}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div className="flex items-center gap-3">
              <Button type="button" onClick={() => void handleUpload()} loading={isLoading}>
                Enviar
              </Button>
              <p className="text-xs text-[#6E6E73]">Tipos: {allowedMimeTypes.join(', ')} • Máx: {maxSizeMb}MB</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
