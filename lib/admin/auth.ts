import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

/**
 * Verifica se o usuário atual tem permissões de administrador
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return false
    
    // Verificar se o usuário tem role de admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    return profile?.role === 'admin'
  } catch (error) {
    console.error('Erro ao verificar permissões de admin:', error)
    return false
  }
}

/**
 * Verifica se o usuário atual tem permissões de editor ou admin
 */
export async function canEdit(): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return false
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    return profile?.role === 'admin' || profile?.role === 'editor'
  } catch (error) {
    console.error('Erro ao verificar permissões de edição:', error)
    return false
  }
}

/**
 * Obtém o perfil do usuário atual
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      
    return profile
  } catch (error) {
    console.error('Erro ao obter perfil do usuário:', error)
    return null
  }
}

/**
 * Requer permissões de administrador - retorna usuário se autorizado
 */
export async function requireAdmin() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Acesso negado: Login necessário')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (!profile || profile.role !== 'admin') {
    throw new Error('Acesso negado: Permissões de administrador necessárias')
  }
  
  return { user, profile }
}

/**
 * Requer permissões de edição - retorna usuário se autorizado
 */
export async function requireEditor() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Acesso negado: Login necessário')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
    throw new Error('Acesso negado: Permissões de edição necessárias')
  }
  
  return { user, profile }
}

/**
 * Cria um usuário admin (só pode ser executado por outros admins ou no setup inicial)
 */
export async function createAdminUser(email: string, password: string, fullName: string): Promise<void> {
  const supabase = await createClient()
  
  // Verificar se já existe um admin (setup inicial)
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')
  
  // Se já existe admin, verificar se o usuário atual é admin
  if (count && count > 0) {
    await requireAdmin()
  }
  
  // Criar usuário no auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: fullName },
    email_confirm: true
  })
  
  if (authError) throw authError
  
  // Atualizar perfil para admin
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', authData.user.id)
    
    if (profileError) throw profileError
  }
}

/**
 * Log de atividade administrativa
 */
export async function logActivity(
  action: string,
  resourceType: string,
  resourceId?: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return
    
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: oldValues,
      new_values: newValues
    })
  } catch (error) {
    console.error('Erro ao registrar log de atividade:', error)
  }
}
