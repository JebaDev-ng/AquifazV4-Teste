'use client'

import { v4 as uuidv4 } from 'uuid'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { useForm, Controller } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'

import * as z from 'zod'

import { motion } from 'framer-motion'

import { Button } from '@/components/admin/ui/button'

import { Input } from '@/components/admin/ui/input'
import { LiquidToggle, GooeyFilter } from '@/components/admin/ui/liquid-toggle'

import ImageUploader from '@/components/admin/products/image-uploader'

import { Product, ProductCategory } from '@/lib/types'

import { DEFAULT_PRODUCT_CATEGORIES } from '@/lib/content'
import type { UploadedImageMeta } from '@/lib/uploads'


const UNIT_OPTIONS = ['unidade', 'par', 'kit', 'm²', 'cm', 'lote'] as const

const productSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  slug: z.string().min(3, 'Slug deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  category: z.string().min(1, 'Selecione uma categoria'),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  original_price: z.number().optional(),
  discount_percent: z.number().min(0).max(90).optional(),
  active: z.boolean(),
  featured: z.boolean(),
  show_on_home: z.boolean(),
  show_on_featured: z.boolean(),
  tags: z.string().optional(),
  meta_description: z.string().optional(),
  min_quantity: z.number().min(1).optional(),
  max_quantity: z.number().optional(),
  unit: z.string().min(1, 'Informe a unidade de venda'),
})



type ProductFormData = z.infer<typeof productSchema>



interface ProductFormProps {

  productId?: string

  initialData?: Product

}



export default function ProductForm({ productId, initialData }: ProductFormProps) {

  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const initialOriginalPrice = initialData?.original_price

  const uploadReferenceId = useMemo(() => initialData?.id ?? uuidv4(), [initialData?.id])
  const [uploadedImages, setUploadedImages] = useState<UploadedImageMeta[]>(() => {
    if (initialData?.images?.length) {
      return initialData.images.map((url, index) => ({
        url,
        storagePath: index === 0 ? initialData.storage_path || '' : '',
      }))
    }

    if (initialData?.image_url) {
      return [{ url: initialData.image_url, storagePath: initialData.storage_path || '' }]
    }

    return []
  })
  const [previewSlug, setPreviewSlug] = useState('')

  const [categories, setCategories] = useState<ProductCategory[]>(DEFAULT_PRODUCT_CATEGORIES)

  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [discountEnabled, setDiscountEnabled] = useState(() => 
    Boolean(initialData?.discount_percent || initialOriginalPrice)
  )
  const [discountPercent, setDiscountPercent] = useState<number>(() => {
    if (initialData?.discount_percent) {
      return initialData.discount_percent
    }
    if (initialOriginalPrice && initialData?.price) {
      return Number((((initialOriginalPrice - initialData.price) / initialOriginalPrice) * 100).toFixed(1))
    }
    return 10
  })

  

  const isEditing = !!productId



  const {

    control,

    register,

    handleSubmit,

    watch,

    setValue,

    formState: { errors }

  } = useForm<ProductFormData>({

    resolver: zodResolver(productSchema),

    defaultValues: {

      name: initialData?.name || '',

      slug: initialData?.slug || '',

      description: initialData?.description || '',

      category: (() => {
        const cat = initialData?.category || ''
        console.log('[ProductForm] defaultValues.category:', cat, 'initialData:', initialData)
        return cat
      })(),

      price: initialData?.price || 0,

  original_price: initialOriginalPrice || undefined,

      active: initialData?.active ?? true,

      featured: initialData?.featured ?? false,

      show_on_home: initialData?.show_on_home ?? false,

      show_on_featured: initialData?.show_on_featured ?? false,

      tags: initialData?.tags?.join(', ') || '',

      meta_description: initialData?.meta_description || '',

      min_quantity: initialData?.min_quantity || 1,

      max_quantity: initialData?.max_quantity || undefined,

      unit: initialData?.unit || 'unidade',

    }

  })



  const watchedName = watch('name')
  const watchedPrice = watch('price')
  const watchedOriginalPrice = watch('original_price')
  const watchedCategory = watch('category')

  const handleDiscountToggle = useCallback(
    (enabled: boolean) => {
      setDiscountEnabled(enabled)

      if (enabled) {
        // Ativar desconto - usar preço atual como original e calcular o preço com desconto
        const defaultPercent = discountPercent || 10
        setDiscountPercent(defaultPercent)
        
        if (watchedPrice > 0) {
          // Preço atual vira o original
          setValue('original_price', watchedPrice, { shouldDirty: true })
          // Calcular novo preço com desconto
          const discountedPrice = Number((watchedPrice * (1 - defaultPercent / 100)).toFixed(2))
          setValue('price', discountedPrice, { shouldDirty: true })
        }
      } else {
        // Desativar desconto - manter apenas o preço atual
        setValue('original_price', undefined, { shouldDirty: true })
      }
    },
    [setValue, watchedPrice, discountPercent],
  )

  const handleDiscountPercentChange = useCallback(
    (percent: number) => {
      const validPercent = Math.min(90, Math.max(0, percent))
      setDiscountPercent(validPercent)
      
      if (validPercent > 0 && watchedOriginalPrice && watchedOriginalPrice > 0) {
        // Calcular preço com desconto baseado no original
        const discountedPrice = Number((watchedOriginalPrice * (1 - validPercent / 100)).toFixed(2))
        setValue('price', discountedPrice, { shouldDirty: true })
      }
    },
    [setValue, watchedOriginalPrice],
  )

  // Recalcular preço quando o original muda (se desconto estiver ativo)
  useEffect(() => {
    if (discountEnabled && discountPercent > 0 && watchedOriginalPrice && watchedOriginalPrice > 0) {
      const discountedPrice = Number((watchedOriginalPrice * (1 - discountPercent / 100)).toFixed(2))
      setValue('price', discountedPrice, { shouldDirty: false })
    }
  }, [watchedOriginalPrice, discountEnabled, discountPercent, setValue])



  // Auto-gerar slug a partir do nome

  useEffect(() => {

    if (watchedName && !isEditing) {

      const slug = watchedName

        .toLowerCase()

        .normalize('NFD')

        .replace(/[\u0300-\u036f]/g, '')

        .replace(/[^a-z0-9\s-]/g, '')

        .replace(/\s+/g, '-')

        .replace(/-+/g, '-')

        .trim()

      

      setValue('slug', slug)

      setPreviewSlug(slug)

    }

  }, [watchedName, setValue, isEditing])



  useEffect(() => {
    let isActive = true

    const loadCategories = async () => {
      try {
        const response = await fetch('/api/admin/categories?active=true')
        if (!response.ok) {
          throw new Error('Erro ao carregar categorias')
        }

        const payload = await response.json()
        if (isActive && Array.isArray(payload.categories)) {
          setCategories(payload.categories)
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
      } finally {
        if (isActive) {
          setCategoriesLoading(false)
        }
      }
    }

    loadCategories()

    return () => {
      isActive = false
    }
  }, [])



  // Define categoria padrão apenas ao criar novo produto

  useEffect(() => {

    if (!isEditing && categories.length > 0 && !watchedCategory) {

      console.log('[ProductForm] Definindo categoria padrão (novo produto):', categories[0].id)

      setValue('category', categories[0].id, { shouldValidate: true })

    }

  }, [categories, isEditing, watchedCategory, setValue])



  const resolvedProductId = productId ?? uploadReferenceId

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true)

    try {
      // Validar desconto
      if (discountEnabled) {
        if (!data.original_price || data.original_price <= data.price) {
          setIsLoading(false)
          alert('Erro no cálculo do desconto. Verifique o percentual e o preço.')
          return
        }
        if (discountPercent <= 0 || discountPercent > 90) {
          setIsLoading(false)
          alert('O percentual de desconto deve estar entre 1% e 90%.')
          return
        }
      }

      // Processar tags
      const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []

      const primaryImage = uploadedImages[0]

      const productData = {
        ...data,
        original_price: discountEnabled ? data.original_price : undefined,
        discount_percent: discountEnabled ? discountPercent : undefined,
        id: resolvedProductId,
        images: uploadedImages.map((image) => image.url),
        image_url: primaryImage?.url || '',
        thumbnail_url: primaryImage?.url || '',
        storage_path: primaryImage?.storagePath,
        tags,
        specifications: {},
        sort_order: 0,
      }



      const url = isEditing ? `/api/admin/products/${productId}` : '/api/admin/products'

      const method = isEditing ? 'PUT' : 'POST'



      const response = await fetch(url, {

        method,

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(productData)

      })



      if (!response.ok) {

        throw new Error('Erro ao salvar produto')

      }



      router.push('/admin/products')

      router.refresh()

    } catch (error) {

      console.error('Erro ao salvar produto:', error)

      alert('Erro ao salvar produto. Tente novamente.')

    } finally {

      setIsLoading(false)

    }

  }



  return (

    <div className="min-h-screen bg-[#FAFAFA] -m-6 p-8">

      <GooeyFilter />

      <div className="max-w-7xl mx-auto">

      {/* Header */}

      <div className="flex items-center gap-4 mb-12">

        <button

          onClick={() => router.back()}

          className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors text-[#1D1D1F]"

        >

          ←

        </button>

        <div>

          <h1 className="text-4xl font-normal text-[#1D1D1F]">

            {isEditing ? 'Editar Produto' : 'Novo Produto'}

          </h1>

          <p className="text-[#6E6E73] mt-1">

            {isEditing ? 'Atualize as informações do produto' : 'Adicione um novo produto ao catálogo'}

          </p>

        </div>

      </div>



      <form onSubmit={handleSubmit(onSubmit)}>

        {/* Layout: 2 colunas - Formulário + Preview/Imagens */}

        <div className="mb-8">

          <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-8 lg:items-start relative">

          {/* Coluna Esquerda: Formulário */}

          <div className="space-y-8">

          {/* Card: Informações Básicas */}

          <div className="bg-white rounded-2xl border border-[#E5E5EA] p-8">

            {/* Informações Básicas */}

            <motion.div

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

            >

              <h2 className="text-lg font-medium text-[#1D1D1F] mb-6">Informações Básicas</h2>

          

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Nome */}

            <div className="lg:col-span-2">

              <label className="block text-sm font-normal text-[#6E6E73] mb-2">

                Nome do Produto *

              </label>

              <Input

                {...register('name')}

                placeholder="Ex: Convite de Casamento"

                error={errors.name?.message}

              />

            </div>



            {/* Slug */}

            <div className="lg:col-span-2">

              <label className="block text-sm font-normal text-[#6E6E73] mb-2">

                Slug (URL) *

              </label>

              <div className="relative">

                <Input

                  {...register('slug')}

                  placeholder="convite-de-casamento"

                  error={errors.slug?.message}

                />

                <div className="mt-1 text-xs text-[#86868B]">

                  URL: /produtos/{previewSlug || 'slug-do-produto'}

                </div>

              </div>

            </div>



            {/* Categoria */}

            <div>

              <label className="block text-sm font-normal text-[#6E6E73] mb-2">

                Categoria *

              </label>

              <Controller

                name="category"

                control={control}

                render={({ field }) => (

                  <select

                    {...field}

                    value={field.value || ''}

                    onChange={(e) => {

                      console.log('[ProductForm] Categoria alterada para:', e.target.value)

                      field.onChange(e.target.value)

                    }}

                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"

                    disabled={categoriesLoading}

                  >

                    {categoriesLoading && <option>Carregando categorias...</option>}

                    {!categoriesLoading && categories.length === 0 && (

                      <option value="">Nenhuma categoria cadastrada</option>

                    )}

                    {!categoriesLoading &&

                      categories.map((category) => (

                        <option key={category.id} value={category.id}>

                          {category.name}

                        </option>

                      ))}

                  </select>

                )}

              />

              {errors.category && (

                <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>

              )}

              <p className="text-xs text-gray-500 mt-1">

                Configure as categorias em <strong>Admin &gt; Categorias</strong> para manter o site alinhado à homepage oficial.

              </p>

            </div>



            {/* Unidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidade
              </label>
              <Controller
                name="unit"
                control={control}
                render={({ field, fieldState }) => {
                  const currentValue = field.value || UNIT_OPTIONS[0]
                  const isCustomUnit = !UNIT_OPTIONS.includes(
                    currentValue as (typeof UNIT_OPTIONS)[number],
                  )
                  const selectValue = isCustomUnit ? 'custom' : currentValue
                  return (
                    <div className="space-y-3">
                      <select
                        value={selectValue}
                        onChange={(event) => {
                          const value = event.target.value
                          if (value === 'custom') {
                            field.onChange('')
                          } else {
                            field.onChange(value)
                          }
                        }}
                        className="w-full rounded-lg border border-[#D2D2D7] bg-white px-4 py-2 text-sm text-[#1D1D1F]"
                      >
                        {UNIT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                        <option value="custom">Outro...</option>
                      </select>
                      {isCustomUnit && (
                        <Input
                          value={field.value || ''}
                          onChange={(event) => field.onChange(event.target.value)}
                          placeholder="Digite a unidade (ex.: conjunto)"
                        />
                      )}
                      {fieldState.error && (
                        <p className="text-sm text-red-600">{fieldState.error.message}</p>
                      )}
                    </div>
                  )
                }}
              />
            </div>



            {/* Descrição */}

            <div className="lg:col-span-2">

              <label className="block text-sm font-medium text-gray-700 mb-2">

                Descrição *

              </label>

              <textarea

                {...register('description')}

                rows={4}

                placeholder="Descreva o produto, suas características e benefícios..."

                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-none"

              />

              {errors.description && (

                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>

              )}

            </div>

          </div>

        </motion.div>



            {/* Preços e Estoque */}

            <motion.div

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ delay: 0.1 }}

              className="pt-8 border-t border-[#E5E5EA]"

            >

              <h2 className="text-lg font-medium text-[#1D1D1F] mb-6">Preços e Estoque</h2>

          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Desconto promocional</p>
              <p className="text-sm text-gray-500">
                Ative para definir um percentual de desconto e exibir a economia na vitrine
              </p>
            </div>
            <div className="inline-flex items-center gap-3 text-sm font-medium text-gray-700">
              <LiquidToggle
                checked={discountEnabled}
                onCheckedChange={handleDiscountToggle}
                aria-label="Alternar desconto promocional"
              />
              <span>{discountEnabled ? 'Desconto ativo' : 'Sem desconto'}</span>
            </div>
          </div>



          {discountEnabled ? (
            // Layout com desconto: 2 linhas de 2 campos
            <div className="space-y-6">
              {/* Linha 1: Preço Original e Desconto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço Original (R$) *
                  </label>
                  <Controller
                    name="original_price"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          const numValue = value ? parseFloat(value) : 0
                          setValue('original_price', numValue, { shouldDirty: true })
                        }}
                        error={errors.original_price?.message}
                        helper="Preço sem desconto"
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desconto (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="90"
                    step="1"
                    placeholder="10"
                    value={discountPercent || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      const percent = value ? parseFloat(value) : 0
                      handleDiscountPercentChange(percent)
                    }}
                    helper="Entre 0% e 90%"
                  />
                </div>
              </div>

              {/* Linha 2: Preço com Desconto e Qtd. Mínima */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço com Desconto (R$)
                  </label>
                  <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="text"
                        placeholder="0.00"
                        value={field.value ? field.value.toFixed(2) : '0.00'}
                        disabled
                        helper="Calculado automaticamente"
                        className="bg-gray-50"
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qtd. Mínima
                  </label>
                  <Controller
                    name="min_quantity"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Linha 3: Qtd. Máxima */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qtd. Máxima
                  </label>
                  <Controller
                    name="max_quantity"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        min="1"
                        placeholder="Sem limite"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Layout sem desconto: 1 linha de 2 campos + 1 linha de 1 campo
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço (R$) *
                  </label>
                  <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value ? parseFloat(value) : 0)
                        }}
                        error={errors.price?.message}
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qtd. Mínima
                  </label>
                  <Controller
                    name="min_quantity"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qtd. Máxima
                  </label>
                  <Controller
                    name="max_quantity"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        min="1"
                        placeholder="Sem limite"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          )}



        </motion.div>

          </div>



          {/* Card: Preços e Estoque */}

          <div className="bg-white rounded-2xl border border-[#E5E5EA] p-8">

            {/* Preços e Estoque */}

            <motion.div

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ delay: 0.3 }}

              className="pt-8 border-t border-[#E5E5EA]"

            >

              <h2 className="text-lg font-medium text-[#1D1D1F] mb-6">SEO e Configurações</h2>

          

          <div className="space-y-6">

            {/* Meta Description */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">

                Meta Descrição (SEO)

              </label>

              <textarea

                {...register('meta_description')}

                rows={3}

                maxLength={160}

                placeholder="Descrição que aparece nos resultados de busca (máx. 160 caracteres)"

                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-none"

              />

              <div className="mt-1 text-xs text-gray-500">

                {watch('meta_description')?.length || 0}/160 caracteres

              </div>

            </div>



            {/* Tags */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">

                Tags (separadas por vírgula)

              </label>

              <Input

                {...register('tags')}

                placeholder="smartphone, apple, 5g, tecnologia"

              />

              <div className="mt-1 text-xs text-gray-500">

                Use tags para facilitar a busca e organização

              </div>

            </div>



            {/* Configurações de Exibição */}

            <div>

              <h3 className="font-medium text-gray-900 mb-4">Exibição</h3>

              <div className="space-y-4">

                {/* Produto Ativo */}

                <div className="flex items-start justify-between gap-4">

                  <div className="flex-1">

                    <span className="text-sm font-medium text-gray-900">Produto ativo</span>

                    <p className="text-xs text-gray-500 mt-0.5">

                      Produto visível no catálogo público

                    </p>

                  </div>

                  <Controller

                    name="active"

                    control={control}

                    render={({ field }) => (

                      <LiquidToggle

                        checked={field.value}

                        onCheckedChange={field.onChange}

                        aria-label="Produto ativo"

                      />

                    )}

                  />

                </div>



                {/* Produto em Destaque */}

                <div className="flex items-start justify-between gap-4">

                  <div className="flex-1">

                    <span className="text-sm font-medium text-gray-900">Produto em destaque</span>

                    <p className="text-xs text-gray-500 mt-0.5">

                      Aparece com badge &quot;Destaque&quot; na listagem

                    </p>

                  </div>

                  <Controller

                    name="featured"

                    control={control}

                    render={({ field }) => (

                      <LiquidToggle

                        checked={field.value}

                        onCheckedChange={field.onChange}

                        aria-label="Produto em destaque"

                      />

                    )}

                  />

                </div>



                {/* Exibir na Homepage */}

                <div className="flex items-start justify-between gap-4">

                  <div className="flex-1">

                    <span className="text-sm font-medium text-gray-900">Exibir na página inicial</span>

                    <p className="text-xs text-gray-500 mt-0.5">

                      Produto aparece nas seções da homepage

                    </p>

                  </div>

                  <Controller

                    name="show_on_home"

                    control={control}

                    render={({ field }) => (

                      <LiquidToggle

                        checked={field.value}

                        onCheckedChange={field.onChange}

                        aria-label="Exibir na página inicial"

                      />

                    )}

                  />

                </div>



                {/* Seção de Produtos em Destaque */}

                <div className="flex items-start justify-between gap-4">

                  <div className="flex-1">

                    <span className="text-sm font-medium text-gray-900">Seção de produtos em destaque</span>

                    <p className="text-xs text-gray-500 mt-0.5">

                      Aparece na seção especial de destaque

                    </p>

                  </div>

                  <Controller

                    name="show_on_featured"

                    control={control}

                    render={({ field }) => (

                      <LiquidToggle

                        checked={field.value}

                        onCheckedChange={field.onChange}

                        aria-label="Seção de produtos em destaque"

                      />

                    )}

                  />

                </div>

              </div>

            </div>

          </div>

        </motion.div>

          </div>
          </div>

          {/* Coluna Direita: Preview + Imagens */}
          <aside className="hidden lg:block lg:relative">
            <div className="lg:sticky lg:top-8 space-y-6">
            
            {/* Card: Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-[#E5E5EA] p-6"
            >
              <div className="mb-4">
                <p className="text-xs text-[#6E6E73] uppercase tracking-wider mb-1">PREVIEW</p>
                <h3 className="text-base font-medium text-[#1D1D1F]">Visual da homepage</h3>
              </div>

              {/* Card do Produto */}
              <div className="group">
                <div className="relative aspect-[3/4] bg-[#F5F5F5] border border-[#D2D2D7] rounded-lg overflow-hidden mb-4 shadow-sm group-hover:shadow-md transition-shadow duration-300">
                  {/* Badge de desconto na imagem */}
                  {discountEnabled && discountPercent > 0 && watchedOriginalPrice && watchedOriginalPrice > watchedPrice && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="inline-block text-xs font-semibold text-white bg-green-600 px-3 py-1.5 rounded-lg shadow-md">
                        {discountPercent}% OFF
                      </span>
                    </div>
                  )}
                  
                  {uploadedImages.length > 0 ? (
                    <Image
                      src={uploadedImages[0].url}
                      alt={watchedName || 'Produto'}
                      fill
                      sizes="(max-width: 768px) 90vw, 30vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                      <p className="text-base font-semibold text-[#6E6E73]">
                        600 x 800
                      </p>
                      <p className="text-sm text-[#86868B] mt-1">
                        pixels
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-[450] text-[#1D1D1F] group-hover:text-[#6E6E73] transition-colors line-clamp-2">
                    {watchedName || 'Nome do Produto'}
                  </h3>
                  <div className="text-[#6E6E73]">
                    <p className="text-sm mb-1">A partir de</p>
                    
                    {/* Preço com desconto */}
                    {discountEnabled && watchedOriginalPrice && watchedOriginalPrice > watchedPrice ? (
                      <div className="space-y-1">
                        <p className="text-sm text-[#86868B] line-through">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(watchedOriginalPrice)}
                        </p>
                        <p className="text-xl font-[450] text-[#1D1D1F]">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(watchedPrice || 0)}
                          <span className="text-sm font-normal text-[#6E6E73] ml-1">
                            / {watch('unit') || 'unidade'}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-xl font-[450] text-[#1D1D1F]">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(watchedPrice || 0)}
                        <span className="text-sm font-normal text-[#6E6E73] ml-1">
                          / {watch('unit') || 'unidade'}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card: Preview de Desconto */}
            {discountEnabled && watchedOriginalPrice && watchedOriginalPrice > 0 && watchedPrice > 0 && watchedOriginalPrice > watchedPrice && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.23 }}
                className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium text-green-900">Desconto ativo</span>
                    </div>
                    <p className="text-xs text-green-700 pl-4">
                      Cliente economiza{' '}
                      <span className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format((watchedOriginalPrice ?? 0) - watchedPrice)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-green-700 mb-0.5">Desconto</div>
                      <div className="text-2xl font-semibold text-green-600">
                        {discountPercent}%
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Card: Imagens do Produto */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl border border-[#E5E5EA] p-6"
            >
              <div className="mb-4">
                <p className="text-xs text-[#6E6E73] uppercase tracking-wider mb-1">GALERIA</p>
                <h3 className="text-base font-medium text-[#1D1D1F]">Imagens do produto</h3>
              </div>
              
              <ImageUploader
                images={uploadedImages}
                onImagesChange={setUploadedImages}
                entityId={resolvedProductId}
                bucket="products"
                entity="products"
                maxImages={5}
              />
            </motion.div>

            </div>
          </aside>

          </div>
        </div>



        {/* Botões de Ação */}

        <motion.div

          initial={{ opacity: 0, y: 20 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ delay: 0.4 }}

          className="flex flex-col sm:flex-row gap-3 pt-6"

        >

          <Button

            type="button"

            onClick={() => router.back()}

            className="flex-1 bg-white border border-[#D2D2D7] text-[#1D1D1F] hover:bg-[#F5F5F5] py-3 rounded-lg font-normal transition-colors"

          >

            Cancelar

          </Button>

          

          <Button

            type="submit"

            disabled={isLoading}

            className="flex-1 bg-[#007AFF] hover:bg-[#0051D5] text-white py-3 rounded-lg font-normal transition-colors disabled:opacity-50"

          >

            {isLoading ? 'Salvando...' : (isEditing ? 'Atualizar Produto' : 'Criar Produto')}

          </Button>

        </motion.div>

      </form>

      </div>

    </div>

  )

}

