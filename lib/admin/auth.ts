import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Profile } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

const PROFILE_COLUMNS = 'id,email,full_name,avatar_url,created_at,updated_at'
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

async function ensureProfileRecord(
  supabase: SupabaseServerClient,
  user: User,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  if (data) {
    return data as Profile
  }

  const fallbackName =
    (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
    user.email ||
    'Administrador'

  const { data: inserted, error: upsertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email ?? '',
      full_name: fallbackName,
      avatar_url:
        (typeof user.user_metadata?.avatar_url === 'string' && user.user_metadata.avatar_url) ||
        null,
    })
    .select(PROFILE_COLUMNS)
    .single()

  if (upsertError) {
    throw upsertError
  }

  return inserted as Profile
}

async function requireAuthenticatedContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Acesso negado: Login necessário')
  }

  const profile = await ensureProfileRecord(supabase, user)
  return { user, profile }
}

/**
 * Verifica se o usuário atual tem permissões de administrador
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    return Boolean(user)
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
    
    return Boolean(user)
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

    return await ensureProfileRecord(supabase, user)
  } catch (error) {
    console.error('Erro ao obter perfil do usuário:', error)
    return null
  }
}

/**
 * Requer permissões de administrador - retorna usuário se autorizado
 */
export async function requireAdmin() {
  return requireAuthenticatedContext()
}

/**
 * Requer permissões de edição - retorna usuário se autorizado
 */
export async function requireEditor() {
  return requireAuthenticatedContext()
}

/**
 * Cria um usuário admin (só pode ser executado por outros admins ou no setup inicial)
 */
export async function createAdminUser(email: string, password: string, fullName: string): Promise<void> {
  const serviceClient = createServiceClient()

  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: fullName },
    email_confirm: true,
  })

  if (authError) {
    throw authError
  }

  if (!authData.user) {
    throw new Error('Falha ao criar usuário administrador')
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
