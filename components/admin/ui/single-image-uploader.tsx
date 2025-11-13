'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { Upload, X, ImageIcon } from 'lucide-react'

import type { UploadedImageMeta } from '@/lib/uploads'

interface SingleImageUploaderProps {
  image: UploadedImageMeta | null
  onImageChange: (image: UploadedImageMeta | null) => void
  entityId: string
  bucket?: 'products' | 'categories' | 'banners' | 'content_sections' | 'media'
  entity?: string
  maxSizeMB?: number
  label?: string
  helperText?: string
  recommendedSize?: string
}

export default function SingleImageUploader({
  image,
  onImageChange,
  entityId,
  bucket = 'content_sections',
  entity = 'hero',
  maxSizeMB = 5,
  label = 'Imagem',
  helperText,
  recommendedSize = '1200×900px',
}: SingleImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!entityId) {
        alert('ID do recurso não disponível. Salve o formulário e tente novamente.')
        return
      }

      if (acceptedFiles.length === 0) return

      const file = acceptedFiles[0]

      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`Arquivo muito grande. Máximo ${maxSizeMB}MB`)
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

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const payload = await response.json()
          onImageChange({
            url: payload.url,
            storagePath: payload.storagePath,
          })
        } else {
          console.error('Erro ao fazer upload:', await response.text())
          alert('Erro ao fazer upload da imagem')
        }
      } catch (error) {
        console.error('Erro no upload:', error)
        alert('Erro ao fazer upload da imagem')
      } finally {
        setIsUploading(false)
      }
    },
    [maxSizeMB, bucket, entity, entityId, onImageChange],
  )

  const isDisabled = isUploading || !entityId

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
    },
    multiple: false,
    disabled: isDisabled,
  })

  const removeImage = () => {
    onImageChange(null)
  }

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-normal text-[#1D1D1F]">
          {label}
        </label>
      )}

      {image ? (
        /* Preview da Imagem */
        <div className="space-y-3">
          <div className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-[#F5F5F5] border border-[#E5E5EA]">
            <Image
              src={image.url}
              alt={label}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 transition-all duration-200 group-hover:bg-black/30" />
            
            {/* Badge */}
            <div className="absolute top-3 left-3">
              <div className="rounded-lg bg-[#007AFF] px-3 py-1.5 text-xs font-normal text-white shadow-lg backdrop-blur-sm">
                {recommendedSize}
              </div>
            </div>

            {/* Remove Button */}
            <button
              type="button"
              onClick={removeImage}
              className="absolute right-3 top-3 rounded-lg bg-white/90 p-2 opacity-0 backdrop-blur-sm transition-all duration-200 hover:bg-red-500 hover:text-white group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <p className="text-xs text-white/90">
                {helperText || 'Imagem exibida na hero section da homepage'}
              </p>
            </div>
          </div>

          {/* Upload Button para substituir */}
          <div
            {...getRootProps()}
            className={`
              rounded-lg border-2 border-dashed transition-all duration-200 py-3
              ${isDragActive 
                ? 'border-[#007AFF] bg-[#007AFF]/5' 
                : 'border-[#D2D2D7] hover:border-[#007AFF] hover:bg-[#F5F5F5]'
              }
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              flex items-center justify-center gap-2
            `}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#007AFF] border-t-transparent" />
                <span className="text-sm text-[#1D1D1F]">Enviando...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 text-[#007AFF]" />
                <span className="text-sm text-[#1D1D1F]">Substituir imagem</span>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Dropzone quando não há imagem */
        <div
          {...getRootProps()}
          className={`
            relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200
            ${isDragActive 
              ? 'border-[#007AFF] bg-[#007AFF]/5' 
              : 'border-[#D2D2D7] hover:border-[#86868B]'
            }
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className={`
              mb-4 rounded-full p-4 transition-colors duration-200
              ${isDragActive ? 'bg-[#007AFF]/10' : 'bg-[#F5F5F5]'}
            `}>
              {isUploading ? (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#007AFF] border-t-transparent" />
              ) : (
                <ImageIcon className={`h-8 w-8 ${isDragActive ? 'text-[#007AFF]' : 'text-[#86868B]'}`} />
              )}
            </div>

            <p className="text-sm font-normal text-[#1D1D1F] mb-1">
              {isUploading 
                ? 'Enviando imagem...' 
                : 'Adicionar imagem'
              }
            </p>
            <p className="text-xs text-[#6E6E73]">
              Arraste e solte ou clique para selecionar
            </p>
            <p className="text-xs text-[#86868B] mt-2">
              PNG, JPG, WEBP • Até {maxSizeMB}MB
            </p>
            {recommendedSize && (
              <p className="text-xs text-[#007AFF] mt-1 font-medium">
                Recomendado: {recommendedSize}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
