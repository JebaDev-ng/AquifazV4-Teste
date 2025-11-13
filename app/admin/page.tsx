import { Suspense } from 'react'
import { DashboardStats } from '@/components/admin/dashboard/dashboard-stats'
import { RecentActivity } from '@/components/admin/dashboard/recent-activity'
import { QuickActions } from '@/components/admin/dashboard/quick-actions'

export default async function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-normal text-[#1D1D1F]">
          Dashboard Administrativo
        </h1>
        <p className="text-[#6E6E73] mt-2">
          Bem-vindo de volta! Aqui está um resumo do seu catálogo e atividades recentes.
        </p>
      </div>
      
      {/* Stats */}
      <Suspense fallback={<StatsLoading />}>
        <DashboardStats />
      </Suspense>
      
      {/* Grid de 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Suspense fallback={<div className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-xl p-6 animate-pulse h-64" />}>
          <QuickActions />
        </Suspense>
        
        <Suspense fallback={<div className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-xl p-6 animate-pulse h-64" />}>
          <RecentActivity />
        </Suspense>
      </div>
    </div>
  )
}

function StatsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-[#FFFFFF] border border-[#E5E5EA] rounded-xl p-6 animate-pulse">
          <div className="h-4 bg-[#F5F5F5] rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-[#F5F5F5] rounded w-1/2"></div>
        </div>
      ))}
    </div>
  )
}