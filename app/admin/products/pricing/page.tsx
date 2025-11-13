'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/admin/ui/button'
import type { Product, ProductCategory } from '@/lib/types'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

interface PriceSummary {
  totalProducts: number
  activeProducts: number
  discountedProducts: number
  averagePrice: number
  highestPrice: number
  lowestPrice: number
}

type CategoryFilter = 'Todos' | string

export default function ProductPricingPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('Todos')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true)
      try {
        const response = await fetch('/api/admin/products')
        if (response.ok) {
          const payload = await response.json()
          setProducts(Array.isArray(payload.products) ? payload.products : [])
        } else {
          setProducts([])
        }
      } catch (error) {
        console.error('Erro ao carregar produtos:', error)
        setProducts([])
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true)
      try {
        const response = await fetch('/api/admin/categories?active=true&with_defaults=true')
        if (response.ok) {
          const payload = await response.json()
          setCategories(Array.isArray(payload.categories) ? payload.categories : [])
        } else {
          setCategories([])
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  const categoryById = useMemo(() => {
    return categories.reduce<Record<string, ProductCategory>>((map, category) => {
      map[category.id] = category
      return map
    }, {})
  }, [categories])

  const filteredProducts = useMemo(() => {
    let data = Array.isArray(products) ? products : []

    if (selectedCategory !== 'Todos') {
      data = data.filter((product) => product.category === selectedCategory)
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase()
      data = data.filter((product) => {
        return (
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
        )
      })
    }

    return data
  }, [products, searchTerm, selectedCategory])

  const priceSummary = useMemo<PriceSummary>(() => {
    if (!Array.isArray(products) || products.length === 0) {
      return {
        totalProducts: 0,
        activeProducts: 0,
        discountedProducts: 0,
        averagePrice: 0,
        highestPrice: 0,
        lowestPrice: 0,
      }
    }

    const totalProducts = products.length
    const activeProducts = products.filter((product) => product.active !== false).length
    const discountedProducts = products.filter((product) => {
      if (typeof product.original_price !== 'number') {
        return false
      }
      return product.original_price > product.price
    }).length

    const prices = products
      .map((product) => (typeof product.price === 'number' ? product.price : 0))
      .filter((price) => price > 0)

    if (prices.length === 0) {
      return {
        totalProducts,
        activeProducts,
        discountedProducts,
        averagePrice: 0,
        highestPrice: 0,
        lowestPrice: 0,
      }
    }

    const totalPrice = prices.reduce((total, price) => total + price, 0)

    return {
      totalProducts,
      activeProducts,
      discountedProducts,
      averagePrice: totalPrice / prices.length,
      highestPrice: Math.max(...prices),
      lowestPrice: Math.min(...prices),
    }
  }, [products])

  const categoryFilters: CategoryFilter[] = useMemo(() => {
    return ['Todos', ...categories.map((category) => category.id)]
  }, [categories])

  const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '—'
    }
    return currencyFormatter.format(value)
  }

  const getCategoryLabel = (categoryId: string) => {
    if (categoryId === 'Todos') {
      return 'Todos'
    }
    return categoryById[categoryId]?.name || categoryId
  }

  const renderSummaryCard = (label: string, value: string, hint?: string) => {
    return (
      <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#6E6E73]">{label}</p>
        <p className="mt-3 text-2xl font-semibold text-[#1D1D1F]">{value}</p>
        {hint && <p className="mt-2 text-xs text-[#6E6E73]">{hint}</p>}
      </div>
    )
  }

  if (loadingProducts) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-6 w-1/3 animate-pulse rounded-lg bg-[#E5E5EA]" />
          <div className="h-32 animate-pulse rounded-2xl bg-[#F5F5F5]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[#F5F5F5]" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <header className="mb-10">
        <p className="text-sm text-[#6E6E73]">Produtos</p>
        <h1 className="mt-2 text-3xl font-normal text-[#1D1D1F]">Gestão de Preços</h1>
        <p className="mt-3 max-w-3xl text-sm text-[#6E6E73]">
          Analise rapidamente a precificação do catálogo e acesse os produtos que precisam de ajustes.
          Utilize os filtros para segmentar por categoria ou buscar itens específicos.
        </p>
      </header>

      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {renderSummaryCard(
          'Produtos cadastrados',
          priceSummary.totalProducts.toString(),
          'Inclui todos os produtos com preço definido.'
        )}
        {renderSummaryCard(
          'Produtos ativos',
          priceSummary.activeProducts.toString(),
          'Produtos disponíveis para o site público.'
        )}
        {renderSummaryCard(
          'Com desconto',
          priceSummary.discountedProducts.toString(),
          'Considera produtos com preço promocional abaixo do original.'
        )}
        {renderSummaryCard(
          'Preço médio',
          formatCurrency(priceSummary.averagePrice),
          'Média calculada apenas entre produtos com preço válido.'
        )}
        {renderSummaryCard('Maior preço', formatCurrency(priceSummary.highestPrice))}
        {renderSummaryCard('Menor preço', formatCurrency(priceSummary.lowestPrice))}
      </section>

      <section className="mb-6 rounded-2xl border border-[#E5E5EA] bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar produto por nome ou descrição"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-[#D2D2D7] px-4 py-3 text-sm outline-none transition focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categoryFilters.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-[#F5F5F5] text-[#1D1D1F] hover:bg-[#E5E5EA]'
                }`}
              >
                {getCategoryLabel(category)}
              </button>
            ))}
            {loadingCategories && (
              <span className="text-xs text-[#6E6E73]">Carregando categorias...</span>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E5E5EA] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E5E5EA]">
            <thead className="bg-[#FAFAFA]">
              <tr className="text-left text-xs font-medium uppercase tracking-[0.2em] text-[#6E6E73]">
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Preço atual</th>
                <th className="px-6 py-4">Preço original</th>
                <th className="px-6 py-4">Desconto</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1F1]">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const originalPrice =
                    typeof product.original_price === 'number' ? product.original_price : undefined

                  const hasDiscount = typeof originalPrice === 'number' && originalPrice > product.price

                  const discountPercent = hasDiscount
                    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
                    : null

                  const statusLabel = product.active === false ? 'Inativo' : 'Ativo'

                  return (
                    <tr key={product.id} className="text-sm text-[#1D1D1F]">
                      <td className="px-6 py-4 align-top">
                        <p className="font-medium text-[#1D1D1F]">{product.name}</p>
                        <p className="mt-1 text-xs text-[#6E6E73] line-clamp-2">{product.description}</p>
                      </td>
                      <td className="px-6 py-4 align-top text-sm text-[#6E6E73]">
                        {getCategoryLabel(product.category)}
                      </td>
                      <td className="px-6 py-4 align-top font-semibold text-[#1D1D1F]">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4 align-top text-[#6E6E73]">
                        {hasDiscount && typeof originalPrice === 'number' ? (
                          <span className="line-through">{formatCurrency(originalPrice)}</span>
                        ) : (
                          formatCurrency(product.original_price)
                        )}
                      </td>
                      <td className="px-6 py-4 align-top">
                        {hasDiscount ? (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                            -{discountPercent}%
                          </span>
                        ) : (
                          <span className="text-xs text-[#6E6E73]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            statusLabel === 'Ativo'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top text-right">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#F5F5F5] px-4 py-2 text-xs font-semibold text-[#1D1D1F] transition hover:bg-[#E5E5EA]"
                        >
                          Editar preço
                        </Link>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-[#6E6E73]">
                    Nenhum produto encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 flex justify-end">
        <Link href="/admin/products">
          <Button variant="outline">Voltar para produtos</Button>
        </Link>
      </div>
    </div>
  )
}
