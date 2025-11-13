import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Package, 
  FileText, 
  Upload,
  Settings,
  User
} from 'lucide-react'

const actionIcons = {
  product_created: Package,
  product_updated: Package,
  content_updated: FileText,
  media_uploaded: Upload,
  settings_updated: Settings,
  user_login: User,
}

const actionColors = {
  product_created: 'text-green-600 bg-green-100',
  product_updated: 'text-[#007AFF] bg-[#007AFF]/10',
  content_updated: 'text-purple-600 bg-purple-100',
  media_uploaded: 'text-orange-600 bg-orange-100',
  settings_updated: 'text-[#6E6E73] bg-[#F5F5F5]',
  user_login: 'text-indigo-600 bg-indigo-100',
}

export async function RecentActivity() {
  const supabase = await createClient()

  // Buscar atividades recentes (limitadas aos últimos 10)
  const { data: activities } = await supabase
    .from('activity_logs')
    .select(`
      *,
      profiles!activity_logs_user_id_fkey (
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="bg-[#FFFFFF] rounded-xl p-6 shadow-sm border border-[#E5E5EA]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-normal text-[#1D1D1F]">
          Atividade Recente
        </h3>
        <button className="text-sm text-[#007AFF] hover:text-[#0056CC]">
          Ver todas
        </button>
      </div>

      <div className="space-y-4">
        {activities && activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        ) : (
          <div className="text-center py-8 text-[#86868B]">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma atividade recente</p>
            <p className="text-xs mt-1">As ações administrativas aparecerão aqui</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface ActivityType {
  id: string
  action: string
  details: {
    product_name?: string
    product_id?: string
    category_name?: string
    category_id?: string
  }
  created_at: string
  resource_id?: string
  new_values?: {
    name?: string
  }
  profile?: {
    name: string
  }
  profiles?: {
    full_name?: string
    email?: string
  }
}

function ActivityItem({ activity }: { activity: ActivityType }) {
  const Icon = actionIcons[activity.action as keyof typeof actionIcons] || Package
  const colorClass = actionColors[activity.action as keyof typeof actionColors] || actionColors.product_created

  const getActionText = () => {
    switch (activity.action) {
      case 'product_created':
        return 'criou o produto'
      case 'product_updated':
        return 'atualizou o produto'
      case 'content_updated':
        return 'atualizou o conteúdo'
      case 'media_uploaded':
        return 'fez upload de mídia'
      case 'settings_updated':
        return 'alterou configurações'
      case 'user_login':
        return 'fez login no sistema'
      default:
        return activity.action
    }
  }

  const getResourceName = () => {
    if (activity.new_values?.name) {
      return activity.new_values.name
    }
    if (activity.resource_id) {
      return `#${activity.resource_id}`
    }
    return 'item'
  }

  return (
    <div className="flex items-start space-x-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#1D1D1F]">
          <span className="font-normal">
            {activity.profiles?.full_name || activity.profiles?.email || 'Admin'}
          </span>
          {' '}
          <span className="text-[#6E6E73]">
            {getActionText()}
          </span>
          {' '}
          <span className="font-normal">
            {getResourceName()}
          </span>
        </p>
        
        <p className="text-xs text-[#86868B] mt-1">
          {formatDistanceToNow(new Date(activity.created_at), {
            addSuffix: true,
            locale: ptBR
          })}
        </p>
      </div>
    </div>
  )
}