BEGIN;

-- Helper para verificar se o usuário tem cargo de administrador/editor
CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
  );
$$ LANGUAGE sql STABLE;

-- Buckets públicos separados por domínio de conteúdo
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT bucket_id, bucket_id, TRUE, 10485760, ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ]
FROM (VALUES
  ('media'),
  ('products'),
  ('categories'),
  ('banners'),
  ('content_sections'),
  ('hero')
) AS buckets(bucket_id)
ON CONFLICT (id) DO UPDATE
SET public = TRUE,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Remover políticas legadas do bucket unificado, caso persistam
DROP POLICY IF EXISTS "Uploads são públicos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar próprios uploads" ON storage.objects;
DROP POLICY IF EXISTS "Admins podem deletar uploads" ON storage.objects;

-- Políticas específicas para cada bucket público
DO $$
DECLARE
  bucket TEXT;
  policy_prefix TEXT;
BEGIN
  FOR bucket IN SELECT unnest(ARRAY['media','products','categories','banners','content_sections','hero'])
  LOOP
    policy_prefix := bucket || '_';

    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', policy_prefix || 'public_read');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', policy_prefix || 'admin_manage');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', policy_prefix || 'admin_update');
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', policy_prefix || 'admin_delete');

    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR SELECT USING (bucket_id = %L);',
      policy_prefix || 'public_read',
      bucket
    );

    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L AND public.is_admin_or_editor());',
      policy_prefix || 'admin_manage',
      bucket
    );

    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR UPDATE USING (bucket_id = %L AND public.is_admin_or_editor()) WITH CHECK (bucket_id = %L AND public.is_admin_or_editor());',
      policy_prefix || 'admin_update',
      bucket,
      bucket
    );

    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR DELETE USING (bucket_id = %L AND public.is_admin_or_editor());',
      policy_prefix || 'admin_delete',
      bucket
    );
  END LOOP;
END$$;

COMMIT;
