'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/ui/header/navbar'
import { Footer } from '@/components/ui/footer/footer'

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Não mostrar navbar e footer nas rotas administrativas
  const isAdminRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/auth')
  
  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  )
}
