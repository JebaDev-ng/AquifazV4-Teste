'use client'

import { motion } from 'framer-motion'
import { 
  Plus, 
  Upload, 
  FileText, 
  Settings,
  Eye,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

const quickActions = [
  {
    name: 'Adicionar Produto',
    description: 'Criar um novo produto',
    href: '/admin/products/new',
    icon: Plus,
    color: 'bg-[#007AFF] hover:bg-[#0056CC]',
  },
  {
    name: 'Upload de Mídia',
    description: 'Enviar novas imagens',
    href: '/admin/media',
    icon: Upload,
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    name: 'Editar Conteúdo',
    description: 'Modificar seções do site',
    href: '/admin/content',
    icon: FileText,
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    name: 'Ver Site',
    description: 'Visualizar site público',
    href: '/',
    icon: Eye,
    color: 'bg-[#6E6E73] hover:bg-[#86868B]',
    external: true,
  },
  {
    name: 'Analytics',
    description: 'Ver relatórios',
    href: '/admin/analytics',
    icon: BarChart3,
    color: 'bg-orange-500 hover:bg-orange-600',
  },
  {
    name: 'Configurações',
    description: 'Ajustar configurações',
    href: '/admin/settings',
    icon: Settings,
    color: 'bg-[#8E8E93] hover:bg-[#6E6E73]',
  },
]

export function QuickActions() {
  return (
    <div className="bg-[#FFFFFF] rounded-xl p-6 shadow-sm border border-[#E5E5EA]">
      <h3 className="text-lg font-normal text-[#1D1D1F] mb-6">
        Ações Rápidas
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {quickActions.map((action, index) => (
          <ActionCard key={action.name} action={action} index={index} />
        ))}
      </div>
    </div>
  )
}

function ActionCard({ 
  action, 
  index 
}: { 
  action: typeof quickActions[0]
  index: number 
}) {
  const Icon = action.icon

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="p-4 rounded-lg border border-[#E5E5EA] hover:border-[#D2D2D7] transition-all cursor-pointer group bg-[#FAFAFA] hover:bg-[#F5F5F5]"
    >
      <div className="flex items-start space-x-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white transition-colors ${action.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-normal text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors">
            {action.name}
          </p>
          <p className="text-xs text-[#6E6E73] mt-1">
            {action.description}
          </p>
        </div>
      </div>
    </motion.div>
  )

  if (action.external) {
    return (
      <a href={action.href} target="_blank" rel="noopener noreferrer">
        {card}
      </a>
    )
  }

  return (
    <Link href={action.href}>
      {card}
    </Link>
  )
}