'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Package, PackagePlus, Unlink } from 'lucide-react'

import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Modal } from '@/components/admin/ui/modal'
import { useToast } from '@/components/admin/ui/use-toast'
import type { ProductCategory } from '@/lib/types'

interface Product {
  id: string
  name: string
  slug: string
  category: string
  active: boolean
  image_url?: string
}

interface CategoryProductsModalProps {
  category: ProductCategory
  allCategories: ProductCategory[]
  isOpen: boolean
  onClose: () => void
  onProductsMoved?: () => void
}

const PAGE_SIZE = 8

interface PaginationState {
  page: number
  pages: number
  total: number
}

const initialPagination: PaginationState = {
  page: 1,
  pages: 1,
  total: 0,
}

export default function CategoryProductsModal({
  category,
  allCategories,
  isOpen,
  onClose,
  onProductsMoved,
}: CategoryProductsModalProps) {
  const { toast } = useToast()

  const [assignedProducts, setAssignedProducts] = useState<Product[]>([])
  const [assignedPagination, setAssignedPagination] = useState<PaginationState>(initialPagination)
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [availablePagination, setAvailablePagination] = useState<PaginationState>(initialPagination)

  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set())
  const [targetCategoryId, setTargetCategoryId] = useState<string>('')

  const [loadingAssigned, setLoadingAssigned] = useState(true)
  const [loadingAvailable, setLoadingAvailable] = useState(false)
  const [addingProducts, setAddingProducts] = useState(false)
  const [moving, setMoving] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showAddProducts, setShowAddProducts] = useState(false)
  const [assignedPage, setAssignedPage] = useState(1)
  const [availablePage, setAvailablePage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const otherCategories = useMemo(
    () => allCategories.filter((cat) => cat.id !== category.id && cat.active),
    [allCategories, category.id],
  )

  const buildParams = (entries: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams()
    Object.entries(entries).forEach(([key, value]) => {
      if (value === undefined || value === '') return
      params.set(key, String(value))
    })
    return params.toString()
  }

  const fetchAssignedProducts = useCallback(
    async (page = 1) => {
      setLoadingAssigned(true)
      setError(null)
      try {
        const query = buildParams({ page, limit: PAGE_SIZE, category: category.id })
        const response = await fetch(`/api/admin/products?${query}`)
        if (!response.ok) {
          throw new Error('Erro ao carregar produtos desta categoria')
        }
        const data = await response.json()
        setAssignedProducts(data.products || [])
        setAssignedPagination(data.pagination || initialPagination)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar produtos desta categoria')
      } finally {
        setLoadingAssigned(false)
      }
    },
    [category.id],
  )

  const fetchAvailableProducts = useCallback(
    async (page = 1, searchValue = '') => {
      setLoadingAvailable(true)
      setError(null)
      try {
        const query = buildParams({
          page,
          limit: PAGE_SIZE,
          exclude_category: category.id,
          search: searchValue || undefined,
        })
        const response = await fetch(`/api/admin/products?${query}`)
        if (!response.ok) {
          throw new Error('Erro ao carregar produtos disponíveis')
        }
        const data = await response.json()
        setAvailableProducts(data.products || [])
        setAvailablePagination(data.pagination || initialPagination)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar produtos disponíveis')
      } finally {
        setLoadingAvailable(false)
      }
    },
    [category.id],
  )

  useEffect(() => {
    if (!isOpen) return

    setShowAddProducts(false)
    setSearchQuery('')
    setDebouncedSearch('')
    setSelectedProducts(new Set())
    setSelectedToAdd(new Set())
    setTargetCategoryId('')
    setAssignedPage(1)
    setAvailablePage(1)
    fetchAssignedProducts(1)
  }, [fetchAssignedProducts, isOpen])

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  useEffect(() => {
    if (!showAddProducts) return
    fetchAvailableProducts(availablePage, debouncedSearch)
  }, [showAddProducts, availablePage, debouncedSearch, fetchAvailableProducts])

  const handleShowAddProducts = () => {
    setShowAddProducts(true)
    setAvailablePage(1)
    setSelectedToAdd(new Set())
    setSearchQuery('')
    setDebouncedSearch('')
  }

  const handleCloseAddProducts = () => {
    setShowAddProducts(false)
    setSelectedToAdd(new Set())
    setSearchQuery('')
    setDebouncedSearch('')
  }

  const handleToggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  const handleToggleProductToAdd = (productId: string) => {
    setSelectedToAdd((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedProducts.size === assignedProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(assignedProducts.map((p) => p.id)))
    }
  }

  const handleSelectAllToAdd = () => {
    if (selectedToAdd.size === availableProducts.length) {
      setSelectedToAdd(new Set())
    } else {
      setSelectedToAdd(new Set(availableProducts.map((p) => p.id)))
    }
  }

  const handleAddProducts = async () => {
    if (selectedToAdd.size === 0) return
    setAddingProducts(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/categories/products/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_ids: Array.from(selectedToAdd),
          target_category_id: category.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao adicionar produtos')
      }

      const data = await response.json()
      toast({
        variant: 'success',
        title: 'Produtos adicionados',
        description: `${data.moved} produto(s) agora fazem parte de "${category.name}".`,
      })

      setSelectedToAdd(new Set())
      handleCloseAddProducts()
      fetchAssignedProducts(assignedPage)
      onProductsMoved?.()
    } catch (err) {
      console.error(err)
      toast({
        variant: 'destructive',
        title: 'Falha ao adicionar produtos',
        description: err instanceof Error ? err.message : 'Tente novamente em instantes.',
      })
    } finally {
      setAddingProducts(false)
    }
  }

  const handleMoveProducts = async () => {
    if (selectedProducts.size === 0 || !targetCategoryId) {
      return
    }

    setMoving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/categories/products/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_ids: Array.from(selectedProducts),
          target_category_id: targetCategoryId,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao mover produtos')
      }

      const data = await response.json()
      toast({
        variant: 'success',
        title: 'Produtos movidos',
        description: `${data.moved} produto(s) foram movidos com sucesso.`,
      })

      setSelectedProducts(new Set())
      setTargetCategoryId('')
      fetchAssignedProducts(assignedPage)
      onProductsMoved?.()
    } catch (err) {
      console.error(err)
      toast({
        variant: 'destructive',
        title: 'Falha ao mover produtos',
        description: err instanceof Error ? err.message : 'Tente novamente mais tarde.',
      })
    } finally {
      setMoving(false)
    }
  }

  const handleUnlinkProducts = async () => {
    if (selectedProducts.size === 0) {
      return
    }

    setUnlinking(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/categories/products/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_ids: Array.from(selectedProducts),
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao desvincular produtos')
      }

      const data = await response.json()
      toast({
        title: 'Produtos desvinculados',
        description: `${data.unlinked} produto(s) movidos para "Sem Categoria".`,
      })

      setSelectedProducts(new Set())
      fetchAssignedProducts(assignedPage)
      onProductsMoved?.()
    } catch (err) {
      console.error(err)
      toast({
        variant: 'destructive',
        title: 'Falha ao desvincular',
        description: err instanceof Error ? err.message : 'Não foi possível desvincular agora.',
      })
    } finally {
      setUnlinking(false)
    }
  }

  const renderProductRow = (product: Product, checked: boolean, onToggle: () => void) => (
    <label
      key={product.id}
      className="flex items-center gap-3 rounded-xl border border-[#E5E5EA] p-3 hover:bg-[#F5F5F7] transition-colors cursor-pointer"
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="rounded border-[#D2D2D7] text-[#007AFF] focus:ring-[#007AFF]"
      />
      {product.image_url ? (
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-[#F5F5F5]">
          <Image src={product.image_url} alt={product.name} fill sizes="48px" className="object-cover" />
        </div>
      ) : (
        <div className="h-12 w-12 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-xs text-[#6E6E73]">
          sem imagem
        </div>
      )}
      <div className="flex-1">
        <p className="text-sm font-medium text-[#1D1D1F]">{product.name}</p>
        <p className="text-xs text-[#6E6E73]">{product.slug}</p>
      </div>
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          product.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
        }`}
      >
        {product.active ? 'Ativo' : 'Inativo'}
      </span>
    </label>
  )

  const renderPagination = (
    pagination: PaginationState,
    page: number,
    onChange: (value: number) => void,
    loading: boolean,
  ) => (
    <div className="flex items-center justify-between rounded-xl border border-[#E5E5EA] px-4 py-2 text-sm">
      <p className="text-[#6E6E73]">
        Página {pagination.pages === 0 ? 0 : page} de {pagination.pages}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<ChevronLeft className="w-4 h-4" />}
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={loading || page <= 1}
        >
          Anterior
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<ChevronRight className="w-4 h-4" />}
          onClick={() => onChange(Math.min(pagination.pages, page + 1))}
          disabled={loading || page >= pagination.pages}
        >
          Próxima
        </Button>
      </div>
    </div>
  )

  if (!isOpen) {
    return null
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Produtos vinculados"
      description={`Gerencie os produtos conectados à categoria "${category.name}".`}
      size="xl"
    >
      <div className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {showAddProducts ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[#6E6E73]">Selecione produtos para adicionar</p>
                <h3 className="text-xl font-medium text-[#1D1D1F]">{category.name}</h3>
              </div>
              <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={handleCloseAddProducts}>
                Voltar
              </Button>
            </div>

            <Input
              placeholder="Pesquisar produto por nome ou slug"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchQuery && (
              <p className="text-xs text-[#6E6E73]">
                Exibindo resultados para &quot;{searchQuery}&quot;
              </p>
            )}

            {loadingAvailable ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#007AFF]" />
              </div>
            ) : availableProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E5E5EA] py-12 text-center text-[#6E6E73]">
                Nenhum produto encontrado com os filtros atuais.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm text-[#1D1D1F]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedToAdd.size === availableProducts.length && availableProducts.length > 0}
                      onChange={handleSelectAllToAdd}
                      className="rounded border-[#D2D2D7] text-[#007AFF] focus:ring-[#007AFF]"
                    />
                    Selecionar todos ({availableProducts.length})
                  </label>
                  {selectedToAdd.size > 0 && (
                    <span className="text-[#007AFF] font-medium">{selectedToAdd.size} selecionado(s)</span>
                  )}
                </div>

                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {availableProducts.map((product) =>
                    renderProductRow(product, selectedToAdd.has(product.id), () =>
                      handleToggleProductToAdd(product.id),
                    ),
                  )}
                </div>

                {renderPagination(availablePagination, availablePage, setAvailablePage, loadingAvailable)}

                <Button
                  icon={<PackagePlus className="w-4 h-4" />}
                  onClick={handleAddProducts}
                  disabled={selectedToAdd.size === 0}
                  loading={addingProducts}
                  className="w-full"
                >
                  Adicionar {selectedToAdd.size} produto(s) à categoria
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[#6E6E73]">Categoria atual</p>
                <h3 className="text-xl font-medium text-[#1D1D1F]">{category.name}</h3>
                <p className="text-xs text-[#6E6E73]">
                  {assignedPagination.total} produto(s) vinculados
                </p>
              </div>
              <Button variant="secondary" icon={<PackagePlus className="w-4 h-4" />} onClick={handleShowAddProducts}>
                Adicionar produtos
              </Button>
            </div>

            {loadingAssigned ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#007AFF]" />
              </div>
            ) : assignedProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E5E5EA] py-12 text-center space-y-4 text-[#6E6E73]">
                <p>Nenhum produto vinculado a esta categoria.</p>
                <Button icon={<PackagePlus className="w-4 h-4" />} onClick={handleShowAddProducts}>
                  Adicionar produtos
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm text-[#1D1D1F]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProducts.size === assignedProducts.length}
                      onChange={handleSelectAll}
                      className="rounded border-[#D2D2D7] text-[#007AFF] focus:ring-[#007AFF]"
                    />
                    Selecionar todos ({assignedProducts.length})
                  </label>
                  {selectedProducts.size > 0 && (
                    <span className="text-[#007AFF] font-medium">
                      {selectedProducts.size} selecionado(s)
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {assignedProducts.map((product) =>
                    renderProductRow(product, selectedProducts.has(product.id), () =>
                      handleToggleProduct(product.id),
                    ),
                  )}
                </div>

                {renderPagination(assignedPagination, assignedPage, (page) => {
                  setAssignedPage(page)
                  fetchAssignedProducts(page)
                }, loadingAssigned)}

                {selectedProducts.size > 0 && (
                  <div className="space-y-4 rounded-2xl border border-[#E5E5EA] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        variant="secondary"
                        icon={<Unlink className="w-4 h-4" />}
                        onClick={handleUnlinkProducts}
                        className="flex-1"
                        loading={unlinking}
                        disabled={moving}
                      >
                        Desvincular {selectedProducts.size} produto(s)
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#1D1D1F]">Mover para outra categoria</label>
                      <select
                        value={targetCategoryId}
                        onChange={(event) => setTargetCategoryId(event.target.value)}
                        className="w-full rounded-xl border border-[#D2D2D7] px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-[#007AFF]"
                      >
                        <option value="">Selecione...</option>
                        {otherCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        icon={<Package className="w-4 h-4" />}
                        onClick={handleMoveProducts}
                        disabled={!targetCategoryId}
                        loading={moving}
                        className="w-full"
                      >
                        Mover {selectedProducts.size} produto(s)
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
