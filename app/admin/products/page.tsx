'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Pencil, Trash2, Grid3x3, List, Plus, RefreshCcw, Package } from 'lucide-react'
import { Button } from '@/components/admin/ui/button'
import { Product, ProductCategory } from '@/lib/types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  
  const PRODUCTS_PER_PAGE = 12

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/admin/categories?active=true&with_defaults=true')
        if (response.ok) {
          const payload = await response.json()
          setCategories(payload.categories || [])
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
      } finally {
        setCategoriesLoading(false)
      }
    }

    loadCategories()
  }, [])

  // Filtrar produtos
  useEffect(() => {
    // Garantir que products é um array
    if (!Array.isArray(products)) {
      setFilteredProducts([])
      return
    }

    let filtered = products

    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
    setCurrentPage(1)
  }, [products, selectedCategory, searchTerm])

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/products')
      if (response.ok) {
        const data = await response.json()
        // A API retorna { products: [], pagination: {} }
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      setProducts([]) // Garantir que seja sempre um array
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Garantir que products é um array antes de usar filter
        if (Array.isArray(products)) {
          setProducts(products.filter(p => p.id !== productId))
        }
      } else {
        alert('Erro ao excluir produto')
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      alert('Erro ao excluir produto')
    }
  }



  useEffect(() => {

    if (

      selectedCategory !== 'Todos' &&

      categories.length > 0 &&

      !categories.some((category) => category.id === selectedCategory)

    ) {

      setSelectedCategory('Todos')

    }

  }, [categories, selectedCategory])



  // Paginação - garantir que filteredProducts é um array
  const totalPages = Math.ceil((filteredProducts?.length || 0) / PRODUCTS_PER_PAGE)
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE
  const paginatedProducts = Array.isArray(filteredProducts) 
    ? filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE)
    : []

  const categoryMap = useMemo(
    () =>
      categories.reduce<Record<string, ProductCategory>>((acc, category) => {
        acc[category.id] = category
        return acc
      }, {}),
    [categories]
  )

  const categoryFilters = ['Todos', ...categories.map((category) => category.id)]

  const getCategoryLabel = (categoryId: string) => {
    if (categoryId === 'Todos') return 'Todos'
    return categoryMap[categoryId]?.name || categoryId
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-8 bg-[#F5F5F5] rounded w-1/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-[#F5F5F5] rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-xl h-80 animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-normal text-[#1D1D1F]">Produtos</h1>
          <p className="text-[#6E6E73] mt-2">
            Gerencie o catálogo de produtos da AquiFaz
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={fetchProducts} 
            variant="ghost" 
            icon={<RefreshCcw className="w-4 h-4" />}
          >
            Atualizar
          </Button>
          <Link href="/admin/products/new">
            <Button icon={<Plus className="w-4 h-4" />}>
              Novo Produto
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-[#D2D2D7] rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent outline-none transition-colors text-[#1D1D1F] placeholder-[#6E6E73]"
            />
          </div>
          
          {/* Toggle de visualização */}
          <div className="flex gap-0.5 bg-[#F5F5F5] p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded font-normal transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#FFFFFF] text-[#007AFF] shadow-sm'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
              title="Visualização em grade"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded font-normal transition-all ${
                viewMode === 'list'
                  ? 'bg-[#FFFFFF] text-[#007AFF] shadow-sm'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
              title="Visualização em lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          {/* Categorias */}
          <div className="flex flex-wrap gap-2 items-center">
            {categoryFilters.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-normal transition-colors ${
                  selectedCategory === category
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-[#F5F5F5] text-[#1D1D1F] hover:bg-[#E5E5EA]'
                }`}
              >
                {getCategoryLabel(category)}
              </button>
            ))}
            {categoriesLoading && (
              <span className="text-xs text-[#6E6E73]">Carregando categorias...</span>
            )}
          </div>
        </div>
        
        {/* Estatísticas */}
        <div className="mt-4 pt-4 border-t border-[#E5E5EA] flex items-center gap-6 text-sm text-[#6E6E73]">
          <span>Total: <strong className="text-[#1D1D1F]">{products.length}</strong> produtos</span>
          <span>Filtrados: <strong className="text-[#1D1D1F]">{filteredProducts.length}</strong></span>
          <span>Ativos: <strong className="text-[#28A745]">{products.filter(p => p.active).length}</strong></span>
          <span>Em destaque: <strong className="text-[#FF9500]">{products.filter(p => p.featured).length}</strong></span>
        </div>
      </div>

      {/* Lista de produtos */}
      {paginatedProducts.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-xl hover:shadow-md transition-shadow"
                >
                  {/* Imagem */}
                  <div className="relative h-48 bg-[#F5F5F5] rounded-t-xl overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-[#6E6E73]">
                        <p className="text-base font-normal">600 x 800</p>
                        <p className="text-sm text-[#86868B]">pixels</p>
                      </div>
                    )}
                    
                    {/* Status badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {product.featured && (
                        <span className="bg-[#FF9500] text-white px-2 py-1 text-xs rounded-full font-normal">
                          Destaque
                        </span>
                      )}
                      {!product.active && (
                        <span className="bg-[#DC3545] text-white px-2 py-1 text-xs rounded-full font-normal">
                          Inativo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-4">
                    <h3 className="font-normal text-[#1D1D1F] mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-[#6E6E73] mb-2">
                      {getCategoryLabel(product.category)}
                    </p>
                    
                    {/* Preços */}
                    <div className="mb-3">
                      {product.original_price && product.original_price > product.price && (
                        <div className="text-xs text-[#6E6E73] line-through">
                          R$ {product.original_price.toLocaleString('pt-BR')}
                        </div>
                      )}
                      <div className="text-lg font-normal text-[#28A745]">
                        R$ {product.price.toLocaleString('pt-BR')}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="flex-1"
                      >
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="w-full" 
                          icon={<Pencil className="w-4 h-4" />}
                        >
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        icon={<Trash2 className="w-4 h-4" />}
                      >
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-xl divide-y divide-[#E5E5EA]">
              {paginatedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-[#F5F5F5] transition-colors"
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Imagem */}
                    <div className="relative w-16 h-16 flex-shrink-0 bg-[#F5F5F5] rounded-lg overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[#6E6E73]">
                          <p className="text-[10px] font-normal">600x800</p>
                        </div>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-normal text-[#1D1D1F] text-sm truncate">
                        {product.name}
                      </h3>
                      <p className="text-xs text-[#6E6E73]">
                        {getCategoryLabel(product.category)}
                      </p>
                    </div>

                    {/* Status badges */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      {product.featured && (
                        <span className="bg-[#FF9500] text-white px-2 py-0.5 text-[10px] rounded-full font-normal">
                          Destaque
                        </span>
                      )}
                      {!product.active && (
                        <span className="bg-[#DC3545] text-white px-2 py-0.5 text-[10px] rounded-full font-normal">
                          Inativo
                        </span>
                      )}
                    </div>

                    {/* Preços */}
                    <div className="text-right flex-shrink-0 min-w-[80px]">
                      {product.original_price && product.original_price > product.price && (
                        <div className="text-[10px] text-[#6E6E73] line-through">
                          R$ {product.original_price.toLocaleString('pt-BR')}
                        </div>
                      )}
                      <div className="text-sm font-normal text-[#28A745]">
                        R$ {product.price.toLocaleString('pt-BR')}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        title="Editar produto"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProduct(product.id)}
                        title="Excluir produto"
                      >
                        <Trash2 className="w-4 h-4 text-[#DC3545]" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                variant="outline"
              >
                Anterior
              </Button>
              
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
                      <Button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        variant={currentPage === page ? "default" : "outline"}
                      >
                        {page}
                      </Button>
                    )
                  } else if (
                    page === currentPage - 3 ||
                    page === currentPage + 3
                  ) {
                    return (
                      <span key={page} className="px-2 py-2 text-[#6E6E73]">
                        ...
                      </span>
                    )
                  }
                  return null
                })}
              </div>
              
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
              >
                Próximo
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-xl p-16 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-[#F5F5F5] rounded-full flex items-center justify-center">
            <Package className="w-12 h-12 text-[#6E6E73]" />
          </div>
          <h3 className="text-xl font-normal text-[#1D1D1F] mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-[#6E6E73] mb-6">
            {searchTerm || selectedCategory !== 'Todos' 
              ? 'Tente ajustar os filtros de busca'
              : 'Comece adicionando o primeiro produto'}
          </p>
          <Link href="/admin/products/new">
            <Button icon={<Plus className="w-4 h-4" />}>
              Adicionar Produto
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

