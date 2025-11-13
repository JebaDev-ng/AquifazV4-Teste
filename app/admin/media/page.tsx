'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Modal } from '@/components/admin/ui/modal'

interface MediaItem {
  id: string
  filename: string
  original_filename: string
  url: string
  type: string
  size: number
  dimensions?: {
    width: number
    height: number
  }
  category?: string
  alt_text?: string
  description?: string
  created_at: string
}

const MEDIA_CATEGORIES = ['Todos', 'Produtos', 'Banners', 'Hero', 'Outros'] as const

const CATEGORY_BUCKET_MAP: Record<(typeof MEDIA_CATEGORIES)[number], 'products' | 'banners' | 'hero' | 'categories'> = {
  Todos: 'products',
  Produtos: 'products',
  Banners: 'banners',
  Hero: 'hero',
  Outros: 'categories',
}

export default function MediaLibraryPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date')
  const [isUploading, setIsUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  
  const ITEMS_PER_PAGE = 24

  const fetchMediaItems = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/media')
      if (response.ok) {
        const data = await response.json()
        setMediaItems(data)
      }
    } catch (error) {
      console.error('Erro ao carregar mídia:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregar mídia
  useEffect(() => {
    fetchMediaItems()
  }, [fetchMediaItems])

  // Filtrar e ordenar
  useEffect(() => {
    let filtered = [...mediaItems]

    // Filtro por categoria
    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(item => item.category === selectedCategory.toLowerCase())
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.alt_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.original_filename.localeCompare(b.original_filename)
        case 'size':
          return b.size - a.size
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredItems(filtered)
    setCurrentPage(1)
  }, [mediaItems, selectedCategory, searchTerm, sortBy])


  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true)

    const targetBucket = CATEGORY_BUCKET_MAP[selectedCategory as (typeof MEDIA_CATEGORIES)[number]] ?? 'products'
    const entity =
      targetBucket === 'products'
        ? 'product'
        : targetBucket === 'categories'
        ? 'category'
        : targetBucket === 'banners'
        ? 'banner'
        : 'hero'
    const entityId = `admin-library-${targetBucket}`
    const prefix = `${targetBucket}/${entityId}`
    const fileRoleBase = `library_${targetBucket}`
    
    try {
      for (const [index, file] of acceptedFiles.entries()) {
        if (file.size > 10 * 1024 * 1024) { // 10MB max
          alert(`Arquivo ${file.name} é muito grande. Máximo 10MB`)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', targetBucket)
        formData.append('entity', entity)
        formData.append('entity_id', entityId)
        formData.append('file_role', `${fileRoleBase}_${Date.now()}_${index}`)
        formData.append('prefix', prefix)
        formData.append('category', targetBucket)

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          // Recarregar lista
          await fetchMediaItems()
        } else {
          console.error('Erro ao fazer upload:', await response.text())
        }
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      alert('Erro ao fazer upload dos arquivos')
    } finally {
      setIsUploading(false)
    }
  }, [selectedCategory, fetchMediaItems])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.svg']
    },
    multiple: true
  })

  const deleteSelectedItems = async () => {
    if (selectedItems.size === 0) return
    
    if (!confirm(`Tem certeza que deseja excluir ${selectedItems.size} item(s)?`)) return

    try {
      for (const itemId of selectedItems) {
        await fetch(`/api/admin/media/${itemId}`, {
          method: 'DELETE'
        })
      }
      
      // Recarregar lista
      await fetchMediaItems()
      setSelectedItems(new Set())
    } catch (error) {
      console.error('Erro ao deletar itens:', error)
      alert('Erro ao deletar itens')
    }
  }

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const selectAllVisible = () => {
    const visibleIds = new Set(paginatedItems.map(item => item.id))
    setSelectedItems(visibleIds)
  }

  const clearSelection = () => {
    setSelectedItems(new Set())
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    alert('URL copiada para a área de transferência!')
  }

  // Paginação
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Biblioteca de Mídia</h1>
          <p className="text-gray-600">
            Gerencie imagens e arquivos do seu site
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            {viewMode === 'grid' ? '📋 Lista' : '⊞ Grade'}
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      <div className="mb-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-xl">
              📁
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isUploading ? 'Fazendo upload...' : 'Adicionar arquivos'}
              </p>
              <p className="text-sm text-gray-600">
                Arraste e solte ou clique para selecionar
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, WEBP, SVG até 10MB cada
              </p>
            </div>

            {isUploading && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtros e Controles */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Busca */}
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Buscar arquivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Categorias */}
          <div className="flex flex-wrap gap-2">
            {MEDIA_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Ordenação */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'size')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="date">Data</option>
            <option value="name">Nome</option>
            <option value="size">Tamanho</option>
          </select>
        </div>

        {/* Estatísticas e Seleção */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span>Total: <strong>{mediaItems.length}</strong> arquivos</span>
            <span>Filtrados: <strong>{filteredItems.length}</strong></span>
            {selectedItems.size > 0 && (
              <span>Selecionados: <strong>{selectedItems.size}</strong></span>
            )}
          </div>

          {selectedItems.size > 0 && (
            <div className="flex gap-2">
              <Button
                onClick={clearSelection}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded-lg text-sm transition-colors"
              >
                Limpar
              </Button>
              <Button
                onClick={selectAllVisible}
                className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-lg text-sm transition-colors"
              >
                Sel. Todos
              </Button>
              <Button
                onClick={deleteSelectedItems}
                className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-lg text-sm transition-colors"
              >
                Deletar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Grid/Lista de Mídia */}
      {paginatedItems.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 mb-8">
              <AnimatePresence>
                {paginatedItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.02 }}
                    className={`
                      relative group bg-white rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-shadow
                      ${selectedItems.has(item.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                    `}
                    onClick={() => setSelectedImage(item)}
                  >
                    {/* Checkbox */}
                    <div 
                      className="absolute top-2 left-2 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    {/* Imagem */}
                    <div className="relative aspect-square bg-gray-100 rounded-t-xl overflow-hidden">
                      <Image
                        src={item.url}
                        alt={item.alt_text || item.original_filename}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 12vw"
                        className="object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {item.original_filename}
                      </h3>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(item.size)}
                        </span>
                        {item.dimensions && (
                          <span className="text-xs text-gray-500">
                            {item.dimensions.width}×{item.dimensions.height}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Overlay de ações */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyImageUrl(item.url)
                          }}
                          className="bg-white text-gray-900 px-3 py-1 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                        >
                          📋 Copiar URL
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === paginatedItems.length}
                          onChange={() => selectedItems.size === paginatedItems.length ? clearSelection() : selectAllVisible()}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Preview</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Nome</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Tamanho</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Dimensões</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Data</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => toggleItemSelection(item.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative h-12 w-12">
                            <Image
                              src={item.url}
                              alt={item.original_filename}
                              fill
                              sizes="48px"
                              className="rounded-lg object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.original_filename}
                            </div>
                            <div className="text-sm text-gray-500">{item.type}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatFileSize(item.size)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.dimensions ? `${item.dimensions.width}×${item.dimensions.height}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(item.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              onClick={() => setSelectedImage(item)}
                              className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded text-xs transition-colors"
                            >
                              Ver
                            </Button>
                            <Button
                              onClick={() => copyImageUrl(item.url)}
                              className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1 rounded text-xs transition-colors"
                            >
                              Copiar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </Button>
              
              <div className="flex gap-1">
                {[...Array(Math.min(totalPages, 7))].map((_, index) => {
                  let page = index + 1
                  
                  if (totalPages > 7) {
                    if (currentPage <= 4) {
                      page = index + 1
                    } else if (currentPage >= totalPages - 3) {
                      page = totalPages - 6 + index
                    } else {
                      page = currentPage - 3 + index
                    }
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>
              
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center text-4xl">
            📁
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum arquivo encontrado
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedCategory !== 'Todos' 
              ? 'Tente ajustar os filtros de busca'
              : 'Comece fazendo upload do primeiro arquivo'}
          </p>
        </div>
      )}

      {/* Modal de Visualização */}
      {selectedImage && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedImage(null)}
          title="Detalhes da Imagem"
        >
          <div className="space-y-6">
            {/* Imagem */}
            <div className="text-center">
              <div className="relative mx-auto h-96 w-full max-w-3xl">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.original_filename}
                  fill
                  sizes="(max-width: 768px) 90vw, 60vw"
                  className="rounded-lg object-contain shadow-sm"
                />
              </div>
            </div>

            {/* Informações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Nome:</span>
                <br />
                {selectedImage.original_filename}
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Tamanho:</span>
                <br />
                {formatFileSize(selectedImage.size)}
              </div>
              
              {selectedImage.dimensions && (
                <div>
                  <span className="font-medium text-gray-700">Dimensões:</span>
                  <br />
                  {selectedImage.dimensions.width} × {selectedImage.dimensions.height}px
                </div>
              )}
              
              <div>
                <span className="font-medium text-gray-700">Tipo:</span>
                <br />
                {selectedImage.type}
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Data:</span>
                <br />
                {new Date(selectedImage.created_at).toLocaleDateString('pt-BR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Categoria:</span>
                <br />
                {selectedImage.category || 'Sem categoria'}
              </div>
            </div>

            {/* URL */}
            <div>
              <span className="font-medium text-gray-700 block mb-2">URL:</span>
              <div className="flex gap-2">
                <Input
                  value={selectedImage.url}
                  readOnly
                  className="flex-1 bg-gray-50"
                />
                <Button
                  onClick={() => copyImageUrl(selectedImage.url)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Copiar
                </Button>
              </div>
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                onClick={() => setSelectedImage(null)}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
              >
                Fechar
              </Button>
              <Button
                onClick={async () => {
                  if (confirm('Tem certeza que deseja excluir esta imagem?')) {
                    try {
                      await fetch(`/api/admin/media/${selectedImage.id}`, {
                        method: 'DELETE'
                      })
                      await fetchMediaItems()
                      setSelectedImage(null)
                    } catch {
                      alert('Erro ao deletar imagem')
                    }
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Excluir
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
