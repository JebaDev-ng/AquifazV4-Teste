-- =====================================================
-- MIGRATION V2: Mídia e Logs
-- Data: 2024-11-12
-- Descrição: Biblioteca de mídia e logs de atividade
-- =====================================================

BEGIN;

-- =====================================================
-- TABELA: media_library
-- Biblioteca de mídia com metadados
-- =====================================================

CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  bucket TEXT NOT NULL DEFAULT 'media',
  checksum TEXT,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  category TEXT DEFAULT 'general',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_media_library_category ON public.media_library(category);
CREATE INDEX IF NOT EXISTS idx_media_library_mime_type ON public.media_library(mime_type);
CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_by ON public.media_library(uploaded_by);
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_library_checksum_unique
  ON public.media_library(bucket, checksum)
  WHERE checksum IS NOT NULL;

-- RLS
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mídia visível para todos"
  ON public.media_library FOR SELECT
  USING (TRUE);

CREATE POLICY "Usuários autenticados podem fazer upload"
  ON public.media_library FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Apenas admins podem deletar mídia"
  ON public.media_library FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- TABELA: activity_logs
-- Log de atividades administrativas
-- =====================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type ON public.activity_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admins podem ver logs"
  ON public.activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Sistema pode inserir logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

COMMIT;
