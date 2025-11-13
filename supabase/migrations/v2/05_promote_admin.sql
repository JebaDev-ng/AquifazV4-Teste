-- =====================================================
-- MIGRATION V2: Promover Todos os Usuários a Admin
-- Data: 2024-11-12
-- Descrição: Promove automaticamente TODOS os usuários a admin
-- =====================================================

BEGIN;

-- =====================================================
-- PROMOVER TODOS OS USUÁRIOS A ADMIN
-- =====================================================

-- Promover todos os usuários existentes a admin
DO $$
DECLARE
  user_record RECORD;
  promoted_count INTEGER := 0;
BEGIN
  -- Iterar sobre todos os usuários do auth.users
  FOR user_record IN
    SELECT id, email, raw_user_meta_data
    FROM auth.users
  LOOP
    -- Inserir ou atualizar perfil como admin
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.raw_user_meta_data->>'full_name', user_record.email),
      'admin'
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin',
        updated_at = TIMEZONE('utc', NOW());
    
    promoted_count := promoted_count + 1;
  END LOOP;

  IF promoted_count > 0 THEN
    RAISE NOTICE '% usuário(s) promovido(s) a admin!', promoted_count;
  ELSE
    RAISE NOTICE 'Nenhum usuário encontrado. Crie usuários no Supabase Auth.';
  END IF;
END $$;

COMMIT;

-- =====================================================
-- COMO FUNCIONA
-- =====================================================

-- Este script promove automaticamente TODOS os usuários
-- existentes no Supabase Auth para admin.

-- Fluxo:
-- 1. Busca todos os usuários em auth.users
-- 2. Para cada usuário, cria/atualiza o perfil com role 'admin'
-- 3. Todos os novos usuários também serão admin automaticamente (via trigger)

-- =====================================================
-- VERIFICAÇÕES ÚTEIS
-- =====================================================

-- Ver todos os usuários
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at;

-- Ver todos os perfis e roles
-- SELECT email, role, created_at FROM profiles ORDER BY created_at;

-- Ver quem é admin
-- SELECT email, role FROM profiles WHERE role = 'admin';

-- =====================================================
-- PROMOVER OUTRO USUÁRIO MANUALMENTE
-- =====================================================

-- Se precisar promover outro usuário específico:
-- UPDATE profiles
-- SET role = 'admin'
-- WHERE email = 'outro-email@exemplo.com';

-- Ou criar perfil admin para usuário existente:
-- INSERT INTO profiles (id, email, full_name, role)
-- SELECT id, email, email, 'admin'
-- FROM auth.users
-- WHERE email = 'outro-email@exemplo.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
