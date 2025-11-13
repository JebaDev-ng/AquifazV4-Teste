'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, GripVertical, ImageIcon } from 'lucide-react'

import type { UploadedImageMeta } from '@/lib/uploads'

interface ImageUploaderProps {
  images: UploadedImageMeta[]
  onImagesChange: (images: UploadedImageMeta[]) => void
  entityId: string
  bucket?: 'products' | 'categories' | 'banners' | 'content_sections' | 'media'
  entity?: string
  maxImages?: number
  maxSizeMB?: number
}

export default function ImageUploader({
  images,
  onImagesChange,
  entityId,
  bucket = 'products',
  entity = 'gallery',
  maxImages = 5,
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!entityId) {
        alert('ID do recurso não disponível. Salve o formulário e tente novamente.')
        return
      }

      if (images.length >= maxImages) {
        alert(`Máximo de ${maxImages} imagens permitidas`)
        return
      }

      setIsUploading(true)

      try {
        const uploaded: UploadedImageMeta[] = []

        for (const file of acceptedFiles) {
          if (file.size > maxSizeMB * 1024 * 1024) {
            alert(`Arquivo ${file.name} é muito grande. Máximo ${maxSizeMB}MB`)
            continue
          }

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
            uploaded.push({
              url: payload.url,
              storagePath: payload.storagePath,
            })
          } else {
            console.error('Erro ao fazer upload:', await response.text())
          }
        }

        if (uploaded.length > 0) {
          const newImages = [...images, ...uploaded].slice(0, maxImages)
          onImagesChange(newImages)
        }
      } catch (error) {
        console.error('Erro no upload:', error)
        alert('Erro ao fazer upload das imagens')
      } finally {
        setIsUploading(false)
      }
    },
    [images, maxImages, maxSizeMB, bucket, entity, entityId, onImagesChange],
  )

  const isDisabled = isUploading || images.length >= maxImages || !entityId

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
    },
    multiple: true,
    disabled: isDisabled,
  })

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    onImagesChange(newImages)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveImage(draggedIndex, dropIndex)
    }

    setDraggedIndex(null)
  }

  return (
    <div>
      {/* Layout: Imagem Principal + Grid de Thumbnails */}
      {images.length > 0 ? (
        <div className="space-y-3">
          {/* Imagem Principal */}
          <div className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-[#F5F5F5] border border-[#E5E5EA]">
            <Image
              src={images[0].url}
              alt="Imagem principal"
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 transition-all duration-200 group-hover:bg-black/30" />
            
            {/* Badge Principal */}
            <div className="absolute top-3 left-3">
              <div className="rounded-lg bg-[#007AFF] px-3 py-1.5 text-xs font-normal text-white shadow-lg backdrop-blur-sm">
                Homepage (600×800)
              </div>
            </div>

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => removeImage(0)}
              className="absolute right-3 top-3 rounded-lg bg-white/90 p-2 opacity-0 backdrop-blur-sm transition-all duration-200 hover:bg-red-500 hover:text-white group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <p className="text-xs text-white/90">
                Imagem exibida na homepage, listagem e seções de produtos
              </p>
            </div>
          </div>

          {/* Thumbnails Grid + Upload Button */}
          <div className="grid grid-cols-5 gap-2">
            {/* Thumbnails Existentes */}
            <AnimatePresence>
              {images.slice(1).map((image, index) => {
                const actualIndex = index + 1
                return (
                  <motion.div
                    key={image.storagePath || image.url}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="group relative aspect-square"
                    draggable
                    onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, actualIndex)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e as unknown as React.DragEvent, actualIndex)}
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-lg bg-[#F5F5F5] border border-[#E5E5EA] transition-all duration-200 hover:border-[#007AFF]">
                      <Image
                        src={image.url}
                        alt={`Imagem ${actualIndex + 1}`}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 transition-all duration-200 group-hover:bg-black/40" />
                      
                      {/* Drag Handle */}
                      <div className="absolute left-1 top-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <div className="rounded bg-white/90 p-1 backdrop-blur-sm">
                          <GripVertical className="h-3 w-3 text-[#1D1D1F]" />
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeImage(actualIndex)}
                        className="absolute right-1 top-1 rounded bg-white/90 p-1 opacity-0 backdrop-blur-sm transition-all duration-200 hover:bg-red-500 hover:text-white group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>

                      {/* Position Number */}
                      <div className="absolute bottom-1 right-1">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1D1D1F]/80 text-[10px] font-normal text-white backdrop-blur-sm">
                          {actualIndex + 1}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Upload Button (se ainda houver espaço) */}
            {images.length < maxImages && (
              <div
                {...getRootProps()}
                className={`
                  aspect-square rounded-lg border-2 border-dashed transition-all duration-200
                  ${isDragActive 
                    ? 'border-[#007AFF] bg-[#007AFF]/5' 
                    : 'border-[#D2D2D7] hover:border-[#007AFF] hover:bg-[#F5F5F5]'
                  }
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  flex items-center justify-center
                `}
              >
                <input {...getInputProps()} />
                {isUploading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#007AFF] border-t-transparent" />
                ) : (
                  <Upload className="h-5 w-5 text-[#86868B]" />
                )}
              </div>
            )}
          </div>

          {/* Info compacta */}
          <div className="space-y-2">
            <p className="text-xs text-[#6E6E73]">
              {images.length}/{maxImages} imagens • Arraste para reordenar
            </p>
            <div className="bg-[#F5F5F5] rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-medium text-[#1D1D1F]">💡 Resoluções Recomendadas:</p>
              <p className="text-xs text-[#6E6E73]">
                <span className="font-medium">1ª imagem:</span> 600×800px (homepage/listagem)
              </p>
              <p className="text-xs text-[#6E6E73]">
                <span className="font-medium">2ª imagem:</span> 1200×1200px (página de detalhes)
              </p>
              <p className="text-xs text-[#86868B] mt-1">
                Se enviar apenas 1 imagem, ela será usada em todos os lugares
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Dropzone quando não há imagens */
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
                ? 'Enviando imagens...' 
                : 'Adicionar imagens do produto'
              }
            </p>
            <p className="text-xs text-[#6E6E73]">
              Arraste e solte ou clique para selecionar
            </p>
            <p className="text-xs text-[#86868B] mt-2">
              PNG, JPG, WEBP • Até {maxSizeMB}MB • Máximo {maxImages} imagens
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
