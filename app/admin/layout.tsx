import { requireEditor } from '@/lib/admin/auth'
import { AdminSidebar } from '@/components/admin/layout/admin-sidebar'
import { AdminHeader } from '@/components/admin/layout/admin-header'
import { Suspense } from 'react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar permissões antes de renderizar o layout
  await requireEditor()
  
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-auto bg-[#FAFAFA]">
          <div className="p-6 min-h-full">
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Painel Administrativo - AquiFaz',
  description: 'Painel de controle para gerenciar produtos e conteúdo',
}