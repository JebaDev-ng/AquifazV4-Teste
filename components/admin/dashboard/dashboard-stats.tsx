import { createClient } from '@/lib/supabase/server'
import { 
  Package, 
  Eye, 
  Star, 
  Image,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

export async function DashboardStats() {
  const supabase = await createClient()

  // Buscar estatísticas em paralelo
  const [
    { count: totalProducts },
    { count: activeProducts },
    { count: featuredProducts },
    { count: totalMedia },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('featured', true),
    supabase.from('media_library').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    {
      name: 'Total de Produtos',
      value: totalProducts || 0,
      icon: Package,
      change: '+12%',
      changeType: 'positive' as const,
      description: 'Total de produtos cadastrados'
    },
    {
      name: 'Produtos Ativos',
      value: activeProducts || 0,
      icon: Eye,
      change: '+5%',
      changeType: 'positive' as const,
      description: 'Produtos visíveis no site'
    },
    {
      name: 'Em Destaque',
      value: featuredProducts || 0,
      icon: Star,
      change: '+2',
      changeType: 'positive' as const,
      description: 'Produtos em destaque'
    },
    {
      name: 'Arquivos de Mídia',
      value: totalMedia || 0,
      icon: Image,
      change: '+25%',
      changeType: 'positive' as const,
      description: 'Imagens e arquivos'
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <StatCard key={stat.name} stat={stat} />
      ))}
    </div>
  )
}

function StatCard({ 
  stat 
}: { 
  stat: {
    name: string
    value: number
    icon: React.ComponentType<{ className?: string }>
    change: string
    changeType: 'positive' | 'negative'
    description: string
  }
}) {
  const Icon = stat.icon

  return (
    <div className="bg-[#FFFFFF] rounded-xl p-6 shadow-sm border border-[#E5E5EA]">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-normal text-[#6E6E73]">
            {stat.name}
          </p>
          <p className="text-2xl font-normal text-[#1D1D1F] mt-2">
            {stat.value.toLocaleString()}
          </p>
        </div>
        
        <div className="w-12 h-12 bg-[#007AFF]/10 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-[#007AFF]" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {stat.changeType === 'positive' ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span 
            className={`text-sm font-normal ${
              stat.changeType === 'positive' 
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {stat.change}
          </span>
        </div>
        
        <p className="text-xs text-[#86868B]">
          vs mês anterior
        </p>
      </div>

      <p className="text-xs text-[#86868B] mt-2">
        {stat.description}
      </p>
    </div>
  )
}
