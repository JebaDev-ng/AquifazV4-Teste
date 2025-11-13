'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  Image,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useHomepageSections } from '@/components/admin/hooks/useHomepageSections'

interface NavigationChild {
  name: string
  href: string
  disabled?: boolean
  badge?: string | null
  children?: NavigationChild[]
}

interface NavigationItem {
  name: string
  href: string
  icon: typeof LayoutDashboard
  exact?: boolean
  children?: NavigationChild[]
}

const staticNavigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    exact: true
  },
  {
    name: 'Produtos',
    href: '/admin/products',
    icon: Package,
    children: [
      { name: 'Lista de Produtos', href: '/admin/products' },
      { name: 'Adicionar Produto', href: '/admin/products/new' },
      { name: 'Categorias', href: '/admin/categories' },
      { name: 'Preços', href: '/admin/products/pricing' },
    ]
  },
  {
    name: 'Mídia',
    href: '/admin/media',
    icon: Image,
  },
  {
    name: 'Conteúdo',
    href: '/admin/content',
    icon: FileText,
    children: [
      { name: 'Hero Section', href: '/admin/content/hero' },
      { name: 'Banners', href: '/admin/content/banners' },
      { name: 'Seções de produtos', href: '/admin/content/sections' },
    ]
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Configurações',
    href: '/admin/configuracoes',
    icon: Settings,
  },
]

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const pathname = usePathname()
  const { sections, isLoading, error } = useHomepageSections()

  const isActive = (item: NavigationItem) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  const childTreeHasMatch = (children?: NavigationChild[]): boolean => {
    if (!children) {
      return false
    }

    return children.some((child) => pathname.startsWith(child.href) || childTreeHasMatch(child.children))
  }

  const hasActiveChild = (item: NavigationItem) => {
    if (!item.children) return false
    return childTreeHasMatch(item.children)
  }

  const dynamicContentChildren = useMemo(() => {
    if (isLoading && sections.length === 0) {
      return Array.from({ length: 4 }).map((_, index) => ({
        name: 'Carregando…',
        href: `#loading-${index}`,
        disabled: true,
      }))
    }

    if (error) {
      return [
        { name: 'Produtos em destaque', href: '/admin/content/sections/featured_showcase', badge: 'Fallback' },
        { name: 'Mais vendidos', href: '/admin/content/sections/best_sellers', badge: 'Fallback' },
        { name: 'Impressão', href: '/admin/content/sections/print', badge: 'Fallback' },
        { name: 'Adesivos', href: '/admin/content/sections/sticker', badge: 'Fallback' },
      ]
    }

    if (!sections.length) {
      return []
    }

    return sections.map((section) => ({
      name: section.title || 'Seção sem título',
      href: `/admin/content/sections/${section.id}`,
      badge: section.is_active ? null : 'Inativa',
    }))
  }, [isLoading, sections, error])

  const navigation = useMemo<NavigationItem[]>(
    () =>
      staticNavigation.map((item) => {
        if (item.name !== 'Conteúdo') {
          return item
        }

        return {
          ...item,
          children: [
            { name: 'Hero Section', href: '/admin/content/hero' },
            { name: 'Banners', href: '/admin/content/banners' },
            {
              name: 'Seções de produtos',
              href: '/admin/content/sections',
              children: dynamicContentChildren.length > 0 ? dynamicContentChildren : undefined,
            },
          ],
        }
      }),
    [dynamicContentChildren],
  )

  const hasDynamicError = Boolean(error)

  return (
    <motion.div
      initial={{ width: collapsed ? '4rem' : '16rem' }}
      animate={{ width: collapsed ? '4rem' : '16rem' }}
      transition={{ duration: 0.3 }}
      className="bg-[#FAFAFA] border-r border-[#E5E5EA] flex flex-col h-full"
    >
      {/* Header */}
      <div className="h-16 border-b border-[#E5E5EA] flex items-center justify-between px-4 flex-shrink-0">
        {!collapsed && (
          <h2 className="font-normal text-[#1D1D1F]">
            Admin Panel
          </h2>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-[#F5F5F5] text-[#6E6E73]"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          const childActive = hasActiveChild(item)
          const shouldExpand = !collapsed && (active || childActive || expandedItem === item.name)

          return (
            <div key={item.name}>
              <Link
                href={item.href}
                onClick={() => {
                  if (item.children && !collapsed) {
                    setExpandedItem(expandedItem === item.name ? null : item.name)
                  }
                }}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-normal transition-colors
                  ${active || childActive
                    ? 'bg-[#007AFF] text-white'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F5]'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.children && (
                      <ChevronRight 
                        className={`w-4 h-4 transition-transform ${
                          shouldExpand ? 'rotate-90' : ''
                        }`} 
                      />
                    )}
                  </>
                )}
              </Link>

              {/* Submenu */}
              {item.children && shouldExpand && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-8 mt-2 space-y-1"
                >
                  {item.children.map((child) => (
                    <div key={child.href} className="space-y-1">
                      <Link
                        href={child.href}
                        className={`
                          flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg transition-colors
                          ${pathname === child.href && !child.disabled
                            ? 'bg-[#007AFF] text-white'
                            : child.disabled
                              ? 'text-[#B0B0B5] cursor-not-allowed'
                              : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F5]'
                          }
                        `}
                        onClick={(event) => {
                          if (child.disabled) {
                            event.preventDefault()
                          }
                        }}
                        aria-disabled={child.disabled || undefined}
                      >
                        <span className="truncate">{child.name}</span>
                        {child.badge && !collapsed && (
                          <span className="text-[11px] uppercase tracking-[0.12em] rounded-full bg-[#F5F5F5] text-[#86868B] px-2 py-0.5">
                            {child.badge}
                          </span>
                        )}
                      </Link>

                      {child.children && child.children.length > 0 && !collapsed && (
                        <div className="ml-4 space-y-1">
                          {child.children.map((grandchild) => (
                            <Link
                              key={grandchild.href}
                              href={grandchild.href}
                              className={`
                                flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg transition-colors
                                ${pathname === grandchild.href
                                  ? 'bg-[#E5F0FF] text-[#1D1D1F]'
                                  : grandchild.disabled
                                    ? 'text-[#B0B0B5] cursor-not-allowed'
                                    : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F5]'
                                }
                              `}
                              onClick={(event) => {
                                if (grandchild.disabled) {
                                  event.preventDefault()
                                }
                              }}
                              aria-disabled={grandchild.disabled || undefined}
                            >
                              <span className="truncate">{grandchild.name}</span>
                              {grandchild.badge && (
                                <span className="text-[11px] uppercase tracking-[0.12em] rounded-full bg-[#F5F5F5] text-[#86868B] px-2 py-0.5">
                                  {grandchild.badge}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-[#E5E5EA] flex-shrink-0 bg-[#FAFAFA]">
          <div className="text-xs text-[#86868B] text-center flex flex-col gap-1">
            <span>AquiFaz Admin v1.21</span>
            {hasDynamicError && (
              <span className="flex items-center justify-center gap-1 text-[#D97706]">
                <AlertCircle className="h-3 w-3" />
                <span>Falha ao carregar seções, exibindo atalhos padrão.</span>
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}
