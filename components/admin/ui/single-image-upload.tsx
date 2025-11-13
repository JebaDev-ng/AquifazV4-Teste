'use client'

import Image from 'next/image'

import { useMemo, useRef, useState } from 'react'

import type { UploadedImageMeta } from '@/lib/uploads'

type StorageBucket =
  | 'products'
  | 'categories'
  | 'banners'
  | 'content_sections'
  | 'media'
  | 'hero'

interface SingleImageUploadProps {
  label: string
  value: UploadedImageMeta | null
  onChange: (image: UploadedImageMeta | null) => void
  bucket: StorageBucket
  entity: string
  entityId?: string
  helperText?: string
  disabled?: boolean
  fileRole?: string
  accept?: string
  maxSizeMb?: number
  allowedMimeTypes?: string[]
  requirementsHint?: string
}

const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export default function SingleImageUpload({
  label,
  value,
  onChange,
  bucket,
  entity,
  entityId,
  helperText,
  disabled = false,
  fileRole = 'main',
  accept = 'image/*',
  maxSizeMb = 5,
  allowedMimeTypes = DEFAULT_ALLOWED_TYPES,
  requirementsHint,
}: SingleImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const requirementsText = useMemo(() => {
    if (requirementsHint) return requirementsHint
    const extensions = (allowedMimeTypes.length > 0 ? allowedMimeTypes : DEFAULT_ALLOWED_TYPES)
      .map((type) => type.split('/')[1]?.toUpperCase())
      .filter(Boolean)
    return `Formatos: ${extensions.join(', ')} • até ${maxSizeMb}MB`
  }, [allowedMimeTypes, maxSizeMb, requirementsHint])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const maxBytes = maxSizeMb * 1024 * 1024
    if (file.size > maxBytes) {
      alert(`Arquivo muito grande. Tamanho máximo: ${maxSizeMb}MB.`)
      event.target.value = ''
      return
    }

    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
      alert('Formato não permitido para este upload.')
      event.target.value = ''
      return
    }

    if (!entityId) {
      alert('Defina o identificador antes de enviar uma imagem.')
      event.target.value = ''
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', bucket)
      formData.append('entity', entity)
      formData.append('entity_id', entityId)
      formData.append('category', bucket)
      formData.append('file_role', fileRole)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const payload = await response.json()
      onChange({ url: payload.url, storagePath: payload.storagePath })
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert('Não foi possível enviar a imagem. Tente novamente.')
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const isDisabled = disabled || !entityId || isUploading

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gray-50">
          {value ? (
            <Image src={value.url} alt={label} fill sizes="160px" className="object-cover" />
          ) : (
            <span className="text-xs text-gray-500 text-center px-2">Nenhuma imagem selecionada</span>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            disabled={isDisabled}
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{requirementsText}</span>
            {isUploading && <span className="text-blue-600 font-medium">Enviando...</span>}
          </div>
          {!entityId && (
            <p className="text-xs text-red-600">Informe o identificador antes do upload.</p>
          )}
          {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
          {value && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
              disabled={isUploading}
            >
              Remover imagem
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
