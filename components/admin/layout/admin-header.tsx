'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Bell, 
  Search, 
  User, 
  LogOut, 
  Moon, 
  Sun,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/lib/types'

export function AdminHeader() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const router = useRouter()

  const loadProfile = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (data) setProfile(data)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProfile()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadProfile])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="h-16 bg-[#FFFFFF] border-b border-[#E5E5EA] flex items-center justify-between px-6">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <Link 
          href="/"
          className="flex items-center space-x-2 text-sm text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Ver Site</span>
        </Link>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#86868B]" />
          <input
            type="text"
            placeholder="Buscar produtos, conteúdo..."
            className="w-full pl-10 pr-4 py-2 bg-[#F5F5F5] border border-[#E5E5EA] rounded-lg text-sm placeholder-[#86868B] focus:ring-2 focus:ring-[#007AFF] focus:border-[#007AFF] text-[#1D1D1F]"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-[#F5F5F5] text-[#6E6E73] transition-colors"
        >
          {darkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-[#F5F5F5] text-[#6E6E73] transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors"
          >
            <div className="w-8 h-8 bg-[#007AFF] rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left text-sm">
              <div className="font-normal text-[#1D1D1F]">
                {profile?.full_name || 'Admin'}
              </div>
              <div className="text-[#6E6E73] capitalize">
                {profile?.role || 'admin'}
              </div>
            </div>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-48 bg-[#FFFFFF] rounded-lg shadow-lg border border-[#E5E5EA] py-1 z-50"
            >
              <Link
                href="/admin/profile"
                className="block px-4 py-2 text-sm text-[#6E6E73] hover:bg-[#F5F5F5] hover:text-[#1D1D1F]"
                onClick={() => setShowUserMenu(false)}
              >
                Meu Perfil
              </Link>
              
              <Link
                href="/admin/settings"
                className="block px-4 py-2 text-sm text-[#6E6E73] hover:bg-[#F5F5F5] hover:text-[#1D1D1F]"
                onClick={() => setShowUserMenu(false)}
              >
                Configurações
              </Link>
              
              <hr className="my-1 border-[#E5E5EA]" />
              
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-[#F5F5F5] flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  )
}