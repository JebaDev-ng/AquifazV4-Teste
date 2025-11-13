'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Modal } from '@/components/admin/ui/modal'
import { GooeyFilter, LiquidToggle } from '@/components/admin/ui/liquid-toggle'
import { FeaturedProductsSection } from '@/components/ui/featured-products-section'
import { ProductsGridSection } from '@/components/ui/products-grid-section'
import { useHomepageSections } from '@/components/admin/hooks/useHomepageSections'
import { slugifyId } from '@/lib/content'
import { AnimatePresence, motion } from 'framer-motion'
import type {
  HomepageSectionItem,
  HomepageSectionProductSummary,
  HomepageSectionWithItems,
  Product,
} from '@/lib/types'

interface SectionResponse {
  section: HomepageSectionWithItems
}

interface SectionsResponse {
  section: HomepageSectionWithItems
}

interface ProductsResponse {
  products: Product[]
  pagination?: {
    page: number
    pages: number
  }
}

const LAYOUT_OPTIONS = [
  { value: 'featured', label: 'Produtos em destaque' },
  { value: 'grid', label: 'Grade' },
]

const BG_OPTIONS = [
  { value: 'white', label: 'Fundo branco' },
  { value: 'gray', label: 'Fundo cinza' },
]

const VISIBLE_PRODUCT_COUNT = 3

const DEFAULT_FORM = {
  id: '',
  title: '',
  subtitle: '',
  layout_type: 'grid' as 'grid' | 'featured',
  bg_color: 'white' as 'white' | 'gray',
  limit: VISIBLE_PRODUCT_COUNT,
  view_all_label: 'Ver todos',
  view_all_href: '/produtos',
  category_id: '',
  sort_order: 0,
  is_active: true,
}

const SLUG_REGEX = /^[a-z0-9-]+$/
const MAX_SLUG_LENGTH = 60

export default function AdminSectionDetailPage() {
  const params = useParams<{ sectionId: string }>()
  const router = useRouter()
  const sectionId = params?.sectionId || 'new'
  const isCreating = sectionId === 'new'
  const { mutate: mutateSections, refresh: refreshSections } = useHomepageSections()

  const [form, setForm] = useState(DEFAULT_FORM)
  const [items, setItems] = useState<HomepageSectionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [productResults, setProductResults] = useState<Product[]>([])
  const [productQuery, setProductQuery] = useState('')
  const [isSearchingProducts, setIsSearchingProducts] = useState(false)
  const [productPage, setProductPage] = useState(1)
  const [productHasMore, setProductHasMore] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [isBulkAdding, setIsBulkAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoSlugEnabled, setAutoSlugEnabled] = useState(isCreating)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [autoViewHrefManaged, setAutoViewHrefManaged] = useState(isCreating)

  const normalizeSlug = useCallback((value: string) => {
    if (!value) {
      return ''
    }

    const base = slugifyId(value)
    if (!base) {
      return ''
    }

    const trimmed = base.replace(/^-+|-+$/g, '')
    if (!trimmed) {
      return ''
    }

    const limited = trimmed.length > MAX_SLUG_LENGTH ? trimmed.slice(0, MAX_SLUG_LENGTH) : trimmed
    return limited.replace(/^-+|-+$/g, '')
  }, [])

  const sanitizeManualSlugInput = useCallback((value: string) => {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, MAX_SLUG_LENGTH)
  }, [])

  const isValidSlug = useCallback((value: string) => {
    return value.length >= 2 && SLUG_REGEX.test(value)
  }, [])

  const sanitizeInternalHref = useCallback((value: string) => {
    const fallback = '/produtos'
    if (!value) {
      return fallback
    }

    const trimmed = value.trim()
    if (!trimmed) {
      return fallback
    }

    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(trimmed)) {
      return fallback
    }

    const cleaned = trimmed.replace(/[\s"'`<>]/g, '')
    const withLeadingSlash = cleaned.startsWith('/') ? cleaned : `/${cleaned.replace(/^\/+/, '')}`
    if (!withLeadingSlash || withLeadingSlash === '/') {
      return fallback
    }

    return withLeadingSlash.length > 200 ? withLeadingSlash.slice(0, 200) : withLeadingSlash
  }, [])

  const generateAutoViewHref = useCallback(
    (raw: string) => {
      const safeSlug = normalizeSlug(raw)
      if (!safeSlug) {
        return '/produtos'
      }
      return `/produtos?section=${encodeURIComponent(safeSlug)}`
    },
    [normalizeSlug],
  )

  useEffect(() => {
    if (!autoSlugEnabled || !isCreating) {
      return
    }

    const nextSlug = normalizeSlug(form.title)
    setForm((prev) => {
      if (prev.id === nextSlug) {
        return prev
      }
      return {
        ...prev,
        id: nextSlug,
      }
    })
    if (nextSlug) {
      setSlugError(null)
    } else if (form.title.trim().length > 0) {
      setSlugError('Não foi possível gerar um identificador com este título. Ajuste o título ou edite manualmente.')
    } else {
      setSlugError(null)
    }
  }, [autoSlugEnabled, form.title, isCreating, normalizeSlug])

  useEffect(() => {
    if (!autoSlugEnabled || !isCreating || !autoViewHrefManaged) {
      return
    }

    const nextHref = generateAutoViewHref(form.id || form.title)
    setForm((prev) => {
      if (prev.view_all_href === nextHref) {
        return prev
      }
      return {
        ...prev,
        view_all_href: nextHref,
      }
    })
  }, [autoSlugEnabled, autoViewHrefManaged, form.id, form.title, generateAutoViewHref, isCreating])

  useEffect(() => {
    if (!isCreating && autoSlugEnabled) {
      setAutoSlugEnabled(false)
      setSlugError(null)
      setAutoViewHrefManaged(false)
    }
  }, [autoSlugEnabled, isCreating])

  const handleToggleAutoSlug = useCallback(
    (checked: boolean) => {
      if (!isCreating) {
        return
      }

      setAutoSlugEnabled(checked)
      if (checked) {
        setAutoViewHrefManaged(true)
        const nextSlug = normalizeSlug(form.title)
        const nextHref = generateAutoViewHref(nextSlug || form.title)
        setForm((prev) => ({
          ...prev,
          id: nextSlug,
          view_all_href: nextHref,
        }))
        if (nextSlug) {
          setSlugError(null)
        } else {
          setSlugError('Não foi possível gerar um identificador com este título. Ajuste o título ou edite manualmente.')
        }
      } else {
        setSlugError(null)
        setAutoViewHrefManaged(false)
      }
    },
    [form.title, generateAutoViewHref, isCreating, normalizeSlug],
  )

  const handleManualSlugChange = useCallback(
    (value: string) => {
      if (autoSlugEnabled || !isCreating) {
        return
      }

      setAutoViewHrefManaged(false)
      const sanitized = sanitizeManualSlugInput(value)
      setForm((prev) => ({
        ...prev,
        id: sanitized,
      }))

      if (!sanitized) {
        setSlugError('Informe um identificador válido.')
        return
      }

      const normalizedCandidate = normalizeSlug(sanitized)
      if (!normalizedCandidate || normalizedCandidate.length < 2) {
        setSlugError('O identificador precisa ter ao menos 2 caracteres.')
        return
      }

      if (!isValidSlug(normalizedCandidate)) {
        setSlugError('Use apenas letras minúsculas, números e hífens.')
        return
      }

      setSlugError(null)
    },
    [autoSlugEnabled, isCreating, normalizeSlug, sanitizeManualSlugInput, isValidSlug],
  )

  const fetchProducts = useCallback(
    async (
      pageNumber = 1,
      append = false,
      options?: { search?: string; category?: string }
    ) => {
      const queryText = (options?.search ?? productQuery ?? '').trim()
      const categoryFilter = (options?.category ?? form.category_id ?? '').trim()

      const params = new URLSearchParams({
        limit: '10',
        page: String(pageNumber),
      })

      if (queryText) {
        params.set('search', queryText)
      }

      if (categoryFilter) {
        params.set('category', categoryFilter)
      }

      setIsSearchingProducts(true)
      try {
        const response = await fetch(`/api/admin/products?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Erro ao buscar produtos.')
        }

  const payload = (await response.json()) as ProductsResponse
        const nextProducts = payload.products ?? []
        setProductResults((prev) => {
          const combined = append ? [...prev, ...nextProducts] : nextProducts
          if (append) {
            setSelectedProductIds((current) =>
              current.filter((productId) => combined.some((product) => product.id === productId)),
            )
          } else {
            setSelectedProductIds([])
          }
          return combined
        })
        setProductPage(pageNumber)
        if (payload.pagination) {
          setProductHasMore(payload.pagination.page < payload.pagination.pages)
        } else {
          setProductHasMore(false)
        }
      } catch (err) {
        console.error(err)
        alert(err instanceof Error ? err.message : 'Erro ao buscar produtos.')
      } finally {
        setIsSearchingProducts(false)
      }
    },
    [form.category_id, productQuery],
  )

  const syncSectionWithStore = useCallback(
    (next: HomepageSectionWithItems) => {
      const normalized: HomepageSectionWithItems = {
        ...next,
        title: next.title?.trim() || 'Seção sem título',
        sort_order: next.sort_order ?? 0,
        is_active: next.is_active ?? true,
        limit: VISIBLE_PRODUCT_COUNT,
        items: (next.items ?? []).map((item) => ({
          ...item,
          sort_order: item.sort_order ?? 0,
        })),
      }

      mutateSections((current) => {
        if (!current) {
          return [normalized]
        }
        const exists = current.some((item) => item.id === normalized.id)
        if (exists) {
          return current.map((item) => (item.id === normalized.id ? normalized : item))
        }
        return [...current, normalized]
      })
    },
    [mutateSections],
  )

  const syncLocalSectionWithStore = useCallback(
    (nextItems: HomepageSectionItem[]) => {
      if (!form.id) {
        return
      }

      syncSectionWithStore({
        id: form.id,
        title: form.title,
        subtitle: form.subtitle || null,
        layout_type: form.layout_type,
        bg_color: form.bg_color,
        limit: VISIBLE_PRODUCT_COUNT,
        view_all_label: form.view_all_label,
        view_all_href: form.view_all_href,
    category_id: form.category_id || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
        config: {},
        items: nextItems,
      })
    },
    [form, syncSectionWithStore],
  )

  const loadSection = useCallback(async () => {
    if (isCreating) {
      setForm(DEFAULT_FORM)
      setItems([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/content/homepage-sections/${sectionId}`)
      if (!response.ok) {
        throw new Error('Não foi possível carregar a seção.')
      }
      const payload = (await response.json()) as SectionResponse
      const data = payload.section

      setForm({
        id: data.id,
        title: data.title,
        subtitle: data.subtitle ?? '',
        layout_type: data.layout_type,
        bg_color: data.bg_color,
        limit: VISIBLE_PRODUCT_COUNT,
        view_all_label: data.view_all_label || 'Ver todos',
        view_all_href: data.view_all_href || '/produtos',
        category_id: data.category_id ?? '',
        sort_order: data.sort_order ?? 1,
        is_active: data.is_active ?? true,
      })
      setItems(data.items ?? [])
      setAutoViewHrefManaged(false)
      syncSectionWithStore(data)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar seção.')
    } finally {
      setIsLoading(false)
    }
  }, [sectionId, isCreating, syncSectionWithStore])

  useEffect(() => {
    loadSection()
  }, [loadSection])

  useEffect(() => {
    setProductQuery('')
    setProductResults([])
    setSelectedProductIds([])
    setProductPage(1)
    setProductHasMore(false)
  }, [sectionId])

  useEffect(() => {
    if (!isModalOpen) {
      return
    }
    setSelectedProductIds((prev) =>
      prev.filter((productId) => items.every((item) => item.product_id !== productId)),
    )
  }, [items, isModalOpen])

  const handleInputChange = (field: keyof typeof form, value: string | number | boolean) => {
    if (field === 'id') {
      handleManualSlugChange(String(value))
      return
    }

    if (field === 'view_all_href') {
      setAutoViewHrefManaged(false)
      const sanitized = sanitizeInternalHref(String(value))
      setForm((prev) => ({
        ...prev,
        view_all_href: sanitized,
      }))
      return
    }

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveSection = async () => {
    if (!form.title.trim()) {
      alert('Informe um título para a seção.')
      return
    }

    const normalizedSlug = normalizeSlug(autoSlugEnabled ? form.title : form.id)
    if (!normalizedSlug) {
      setSlugError('Informe um identificador válido antes de salvar.')
      alert('Informe um identificador válido para a seção.')
      return
    }

    if (!isValidSlug(normalizedSlug)) {
      setSlugError('Use apenas letras minúsculas, números e hífens. O identificador precisa ter pelo menos 2 caracteres.')
      alert('Identificador inválido. Use letras minúsculas, números e hífens (mínimo de 2 caracteres).')
      return
    }

    setSlugError(null)

    setIsSaving(true)
    try {
      if (isCreating) {
        setForm((prev) => ({
          ...prev,
          id: normalizedSlug,
        }))
      }

      const resolvedHref = autoSlugEnabled && autoViewHrefManaged
        ? generateAutoViewHref(normalizedSlug)
        : sanitizeInternalHref(form.view_all_href)

      const payload = {
        id: isCreating ? normalizedSlug : undefined,
        title: form.title.trim(),
        subtitle: form.subtitle?.trim() || undefined,
        layout_type: form.layout_type,
        bg_color: form.bg_color,
        limit: VISIBLE_PRODUCT_COUNT,
        view_all_label: form.view_all_label.trim() || 'Ver todos',
        view_all_href: resolvedHref,
        category_id: form.category_id?.trim() || undefined,
        sort_order: isCreating ? undefined : form.sort_order,
        is_active: form.is_active,
      }

      const endpoint = isCreating
        ? '/api/admin/content/homepage-sections'
        : `/api/admin/content/homepage-sections/${sectionId}`
      const method = isCreating ? 'POST' : 'PUT'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Não foi possível salvar a seção.')
      }

      const { section } = (await response.json()) as SectionsResponse
      if (isCreating) {
        router.replace(`/admin/content/sections/${section.id}`)
      }
      setAutoViewHrefManaged(false)
      setForm((prev) => ({
        ...prev,
        id: section.id,
        view_all_href: section.view_all_href || resolvedHref,
        sort_order: section.sort_order ?? prev.sort_order,
        limit: VISIBLE_PRODUCT_COUNT,
      }))
      setItems(section.items ?? items)
      syncSectionWithStore(section)
      await refreshSections()
      alert('Seção salva com sucesso.')
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Erro ao salvar seção.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenProductModal = () => {
    setSelectedProductIds([])
    setIsModalOpen(true)
    void fetchProducts(1, false)
  }

  const handleCloseProductModal = () => {
    setIsModalOpen(false)
    setSelectedProductIds([])
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!form.id) return
    try {
      const response = await fetch(
        `/api/admin/content/homepage-sections/${form.id}/items/${itemId}`,
        {
          method: 'DELETE',
        },
      )
      if (!response.ok) {
        throw new Error('Não foi possível remover o produto.')
      }
      const nextItems = items.filter((item) => item.id !== itemId)
      setItems(nextItems)
      syncLocalSectionWithStore(nextItems)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Erro ao remover produto.')
    }
  }

  const handleMoveItem = async (itemId: string, direction: number) => {
    if (!form.id) return
    const index = items.findIndex((item) => item.id === itemId)
    const targetIndex = index + direction
    if (index === -1 || targetIndex < 0 || targetIndex >= items.length) return

    const reordered = [...items]
    const [removed] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, removed)
    setItems(reordered)
    syncLocalSectionWithStore(reordered)

    try {
      const payload = {
        items: reordered.map((item, position) => ({
          id: item.id,
          sort_order: position + 1,
        })),
      }

      const response = await fetch(
        `/api/admin/content/homepage-sections/${form.id}/items/reorder`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      if (!response.ok) {
        throw new Error('Não foi possível reordenar os produtos.')
      }
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Erro ao reordenar produtos.')
    }
  }

  const handleSearchProducts = async () => {
    await fetchProducts(1, false)
  }

  const handleLoadMoreProducts = async () => {
    if (productHasMore && !isSearchingProducts) {
      await fetchProducts(productPage + 1, true)
    }
  }

  const addProductToSection = async (product: Product, options: { silent?: boolean } = {}) => {
    const { silent = false } = options
    if (!form.id) {
      if (!silent) {
        alert('Salve a seção antes de adicionar produtos.')
      }
      return false
    }
    if (!isProductUsable(product)) {
      if (!silent) {
        alert('O produto precisa de preço e unidade antes de ser exibido na homepage.')
      }
      return false
    }
    try {
      const response = await fetch(`/api/admin/content/homepage-sections/${form.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Erro ao adicionar produto.')
      }

      const payload = await response.json()
      const newItem = payload.item as HomepageSectionItem
      const nextItems = [...items, newItem]
      setItems(nextItems)
      syncLocalSectionWithStore(nextItems)
      if (!silent) {
        alert('Produto adicionado.')
      }
      return true
    } catch (err) {
      console.error(err)
      if (!silent) {
        alert(err instanceof Error ? err.message : 'Erro ao adicionar produto.')
      }
      return false
    }
  }

  const handleAddProductToSection = async (product: Product) => {
    await addProductToSection(product)
  }

  const handleAddSelectedProducts = async () => {
    if (!form.id) {
      alert('Salve a seção antes de adicionar produtos.')
      return
    }

    const productsToAdd = productResults.filter((product) => selectedProductIds.includes(product.id))
    if (productsToAdd.length === 0) {
      alert('Selecione ao menos um produto para adicionar.')
      return
    }

    setIsBulkAdding(true)
    let successCount = 0
    try {
      for (const product of productsToAdd) {
        const added = await addProductToSection(product, { silent: true })
        if (added) {
          successCount += 1
          setSelectedProductIds((prev) => prev.filter((id) => id !== product.id))
        }
      }

      if (successCount > 0) {
        alert(
          `${successCount} produto${successCount > 1 ? 's' : ''} adicionad${
            successCount > 1 ? 'os' : 'o'
          }.`,
        )
      }
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Erro ao adicionar produtos.')
    } finally {
      setIsBulkAdding(false)
    }
  }

  const isProductUsable = useCallback(
    (product: Product) =>
      Boolean(
        product.unit && product.unit.trim().length > 0 && product.price !== null && product.price !== undefined,
      ),
    [],
  )

  const previewProducts: Product[] = useMemo(() => {
    const resolved = items
      .map((item) => mapItemToProduct(item))
      .filter((product): product is Product => Boolean(product))
      .slice(0, VISIBLE_PRODUCT_COUNT)

    if (resolved.length === 0) {
      return PREVIEW_PLACEHOLDER_PRODUCTS.slice(0, VISIBLE_PRODUCT_COUNT)
    }

    return resolved
  }, [items])

  const existingProductIds = useMemo(() => new Set(items.map((item) => item.product_id)), [items])

  const selectableProductIds = useMemo(
    () =>
      productResults
        .filter((product) => isProductUsable(product) && !existingProductIds.has(product.id))
        .map((product) => product.id),
    [productResults, existingProductIds, isProductUsable],
  )

  const allSelectableChecked = useMemo(
    () => selectableProductIds.length > 0 && selectableProductIds.every((id) => selectedProductIds.includes(id)),
    [selectableProductIds, selectedProductIds],
  )

  const selectedCount = selectedProductIds.length

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(Array.from(new Set(selectableProductIds)))
    } else {
      setSelectedProductIds([])
    }
  }

  const toggleProductSelection = (productId: string, selectable: boolean, checked: boolean) => {
    if (!selectable) {
      return
    }
    setSelectedProductIds((prev) => {
      if (checked) {
        if (prev.includes(productId)) {
          return prev
        }
        return [...prev, productId]
      }
      return prev.filter((id) => id !== productId)
    })
  }

  return (
    <>
      <GooeyFilter />
      <div className="space-y-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-[#6E6E73] mb-2">
              {isCreating ? 'Nova seção' : `Editando seção #${form.sort_order ?? ''}`}
            </p>
            <h1 className="text-3xl font-normal text-[#1D1D1F]">
              {isCreating ? 'Criar seção da homepage' : form.title || 'Seção'}
            </h1>
            <p className="text-[#6E6E73] mt-2 max-w-3xl">
              Configure os textos, CTA e produtos exibidos neste bloco. A prévia usa o mesmo componente da
              homepage pública para garantir fidelidade visual.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/content/sections">
              <Button variant="secondary">Voltar</Button>
            </Link>
            <Button onClick={handleSaveSection} loading={isSaving}>
              {isCreating ? 'Criar seção' : 'Salvar alterações'}
            </Button>
          </div>
        </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-[#E5E5EA] bg-white p-6 space-y-4">
          <div className="h-6 w-1/3 rounded bg-[#F5F5F5] animate-pulse" />
          <div className="h-32 rounded bg-[#F5F5F5] animate-pulse" />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[60%_40%]">
          <div className="rounded-2xl border border-[#E5E5EA] bg-white p-6 space-y-6">
            <section className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium leading-none text-[#1D1D1F]">
                      Identificador (slug)
                    </span>
                    <div
                      className={`flex items-center gap-2 text-xs ${
                        isCreating ? 'text-[#6E6E73]' : 'text-[#B0B0B5]'
                      }`}
                    >
                      <LiquidToggle
                        checked={autoSlugEnabled}
                        onCheckedChange={handleToggleAutoSlug}
                        disabled={!isCreating}
                        className="shrink-0"
                        aria-label="Alternar geração automática do slug"
                      />
                      <span>Gerar automaticamente</span>
                    </div>
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    {autoSlugEnabled ? (
                      <motion.div
                        key="slug-auto"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="space-y-1"
                      >
                        <p className={`text-sm ${slugError ? 'text-red-600' : 'text-[#1D1D1F]'}`}>
                          {form.id || 'Será gerado automaticamente a partir do título.'}
                        </p>
                        <p className={`text-xs ${slugError ? 'text-red-600' : 'text-[#6E6E73]'}`}>
                          {slugError
                            ? slugError
                            : 'Gerado automaticamente a partir do título.'}
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="slug-manual"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                      >
                        <Input
                          value={form.id}
                          onChange={(event) => handleInputChange('id', event.target.value)}
                          placeholder="ex.: featured-showcase"
                          disabled={!isCreating}
                          error={slugError ?? undefined}
                          helper={
                            slugError
                              ? undefined
                              : isCreating
                                  ? 'Use letras minúsculas, números e hífens. Até 60 caracteres.'
                                  : 'Identificador definido no momento da criação.'
                          }
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1D1D1F]">Layout</label>
                  <select
                    value={form.layout_type}
                    onChange={(event) =>
                      handleInputChange('layout_type', event.target.value as 'grid' | 'featured')
                    }
                    className="w-full rounded-lg border border-[#D2D2D7] bg-white px-4 py-2 text-sm text-[#1D1D1F]"
                  >
                    {LAYOUT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Input
                label="Título"
                value={form.title}
                onChange={(event) => handleInputChange('title', event.target.value)}
                required
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1D1D1F]">Subtítulo</label>
                <textarea
                  className="w-full rounded-lg border border-[#D2D2D7] bg-white px-4 py-3 text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:border-[#007AFF]"
                  rows={2}
                  value={form.subtitle ?? ''}
                  onChange={(event) => handleInputChange('subtitle', event.target.value)}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Texto do link"
                  value={form.view_all_label}
                  onChange={(event) => handleInputChange('view_all_label', event.target.value)}
                />
                <Input
                  label="URL do link"
                  value={form.view_all_href}
                  onChange={(event) => handleInputChange('view_all_href', event.target.value)}
                  disabled={autoSlugEnabled && autoViewHrefManaged}
                  helper={
                    autoSlugEnabled && autoViewHrefManaged
                      ? 'Gerado automaticamente a partir do identificador e restrito a rotas internas.'
                      : 'Use apenas caminhos internos (ex.: /produtos?section=meu-id). Protocolos externos são ignorados.'
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1D1D1F]">Fundo</label>
                  <select
                    value={form.bg_color}
                    onChange={(event) =>
                      handleInputChange('bg_color', event.target.value as 'white' | 'gray')
                    }
                    className="w-full rounded-lg border border-[#D2D2D7] bg-white px-4 py-2 text-sm text-[#1D1D1F]"
                  >
                    {BG_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Categoria vinculada (opcional)"
                  value={form.category_id}
                  onChange={(event) => handleInputChange('category_id', event.target.value)}
                  placeholder="ex.: banners"
                  helper="Usado apenas para controle interno."
                />
              </div>
              <p className="text-xs text-[#6E6E73]">
                Mostramos automaticamente até três produtos na homepage. Adicione quantos precisar;
                os demais ficam disponíveis no link “Ver todos”.
              </p>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-[#1D1D1F]">Seção ativa</label>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => handleInputChange('is_active', event.target.checked)}
                  className="h-4 w-4 rounded border-[#D2D2D7] text-[#007AFF] focus:ring-[#007AFF]"
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-[#1D1D1F]">Produtos da seção</h2>
                  <p className="text-sm text-[#6E6E73]">
                    {form.id
                      ? 'Arraste para reordenar ou adicione novos produtos por meio da busca.'
                      : 'Salve a seção para liberar a seleção de produtos.'}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={handleOpenProductModal}
                  disabled={!form.id}
                >
                  Adicionar produto
                </Button>
              </div>

              <div className="space-y-3">
                {items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-[#D2D2D7] p-6 text-center text-sm text-[#6E6E73]">
                    Nenhum produto vinculado ainda.
                  </div>
                )}

                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-[#E5E5EA] bg-[#FAFAFA] p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1D1D1F]">
                        {item.product?.name || 'Produto removido'}
                      </p>
                      <p className="text-xs text-[#6E6E73]">
                        Ordem #{index + 1} · {item.product?.category || 'categoria desconhecida'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleMoveItem(item.id, -1)}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleMoveItem(item.id, 1)}
                        disabled={index === items.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="rounded-2xl border border-[#E5E5EA] overflow-hidden">
            <div className="bg-white p-6 pb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#6E6E73]">Preview</p>
              <h2 className="text-lg font-medium text-[#1D1D1F]">Visual da homepage</h2>
            </div>
            {form.layout_type === 'featured' ? (
              <FeaturedProductsSection
                products={previewProducts}
                title={form.title || 'Produtos em destaque'}
                subtitle={form.subtitle || undefined}
                viewAllHref={form.view_all_href}
                viewAllLabel={form.view_all_label}
                bgColor={form.bg_color}
              />
            ) : (
              <ProductsGridSection
                products={previewProducts}
                title={form.title || 'Produtos'}
                subtitle={form.subtitle || undefined}
                viewAllHref={form.view_all_href}
                viewAllLabel={form.view_all_label}
                bgColor={form.bg_color}
              />
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseProductModal}
        title="Adicionar produto"
        description="Busque produtos cadastrados e vincule a esta seção."
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Buscar por nome ou descrição"
              value={productQuery}
              onChange={(event) => setProductQuery(event.target.value)}
            />
            <Button variant="secondary" onClick={handleSearchProducts} loading={isSearchingProducts}>
              Buscar
            </Button>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-[#E5E5EA] bg-[#F9F9FB] p-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm text-[#1D1D1F]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#D2D2D7] text-[#007AFF] focus:ring-[#007AFF]"
                checked={allSelectableChecked}
                onChange={(event) => handleToggleSelectAll(event.target.checked)}
                disabled={!selectableProductIds.length || isBulkAdding}
              />
              Selecionar todos os resultados disponíveis
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <span className="text-xs text-[#6E6E73]">
                {selectedCount} produto{selectedCount === 1 ? '' : 's'} selecionado{selectedCount === 1 ? '' : 's'}
              </span>
              <Button
                onClick={handleAddSelectedProducts}
                disabled={!selectedCount || isBulkAdding}
                loading={isBulkAdding}
              >
                Adicionar selecionados
              </Button>
            </div>
          </div>
          <div className="space-y-3 max-h-96 overflow-auto">
            {productResults.map((product) => {
              const isValidProduct = isProductUsable(product)
              const alreadyAdded = existingProductIds.has(product.id)
              const isSelectable = isValidProduct && !alreadyAdded
              const isSelected = selectedProductIds.includes(product.id)
              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-[#E5E5EA] p-4"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-[#D2D2D7] text-[#007AFF] focus:ring-[#007AFF]"
                      checked={isSelected}
                      disabled={!isSelectable || isBulkAdding}
                      onChange={(event) => toggleProductSelection(product.id, isSelectable, event.target.checked)}
                    />
                    <div>
                      <p className="text-sm font-medium text-[#1D1D1F]">{product.name}</p>
                      <p className="text-xs text-[#6E6E73]">
                        {product.category || 'categoria desconhecida'} · {product.unit || 'unidade'}
                      </p>
                      {!isValidProduct && (
                        <p className="text-xs text-red-500 mt-1">
                          Defina preço e unidade no cadastro do produto para habilitar.
                        </p>
                      )}
                      {alreadyAdded && (
                        <p className="text-xs text-[#34C759] mt-1">Produto já vinculado a esta seção.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alreadyAdded ? (
                      <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-medium text-[#2E7D32]">
                        Adicionado
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAddProductToSection(product)}
                        disabled={!isSelectable || isBulkAdding}
                        title={
                          isSelectable
                            ? undefined
                            : 'Produto precisa de preço e unidade para aparecer na homepage.'
                        }
                      >
                        Adicionar
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
            {productResults.length === 0 && !isSearchingProducts && (
              <p className="text-sm text-[#6E6E73]">Nenhum produto encontrado.</p>
            )}
            {productHasMore && (
              <div className="text-center">
                <Button
                  variant="secondary"
                  onClick={handleLoadMoreProducts}
                  loading={isSearchingProducts}
                >
                  Carregar mais
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>
      </div>
    </>
  )
}

function mapItemToProduct(item: HomepageSectionItem): Product | null {
  if (!item.product) return null
  const summary = item.product as HomepageSectionProductSummary
  return {
    id: summary.id,
    name: summary.name,
    slug: summary.slug,
    description: summary.description || '',
    category: summary.category || 'diversos',
    price: Number(summary.price ?? 0),
    unit: summary.unit || 'unidade',
    image_url: summary.image_url || '',
    storage_path: summary.storage_path || undefined,
    created_at: new Date().toISOString(),
  }
}
const PREVIEW_PLACEHOLDER_PRODUCTS: Product[] = [
  {
    id: 'preview-1',
    name: 'Cartões de Visita Premium',
    slug: 'cartoes-visita-preview',
    description: 'Produto demonstrativo',
    category: 'preview',
    price: 89.9,
    unit: 'unidade',
    image_url: '',
    created_at: new Date().toISOString(),
  },
  {
    id: 'preview-2',
    name: 'Adesivos Personalizados',
    slug: 'adesivos-preview',
    description: 'Produto demonstrativo',
    category: 'preview',
    price: 59.9,
    unit: 'unidade',
    image_url: '',
    created_at: new Date().toISOString(),
  },
  {
    id: 'preview-3',
    name: 'Banner 1x2m',
    slug: 'banner-preview',
    description: 'Produto demonstrativo',
    category: 'preview',
    price: 149.9,
    unit: 'unidade',
    image_url: '',
    created_at: new Date().toISOString(),
  },
]
