-- =====================================================
-- MIGRATION: Add checksum column to media table
-- Date: 2025-11-12
-- Goal: Support deduplicated media uploads via SHA-256 fingerprints
-- =====================================================

BEGIN;

ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS checksum TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_media_checksum_unique
  ON public.media(checksum)
  WHERE checksum IS NOT NULL;

COMMIT;
