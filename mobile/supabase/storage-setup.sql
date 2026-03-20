-- ============================================================================
-- PORTPAL Storage Setup: Work Slips
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- This migration:
--   1. Creates a 'work-slips' storage bucket
--   2. Adds an 'attachments' JSONB column to the shifts table
--   3. Sets up RLS policies so users can only access their own files
-- ============================================================================


-- ============================================================================
-- 1. CREATE STORAGE BUCKET
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'work-slips',
  'work-slips',
  false,
  10485760,  -- 10 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ============================================================================
-- 2. ADD ATTACHMENTS COLUMN TO SHIFTS TABLE
-- ============================================================================

ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.shifts.attachments IS 'Array of {url, name, type} objects for uploaded work slip files';


-- ============================================================================
-- 3. STORAGE RLS POLICIES
-- Users can only upload/read/delete files in their own folder: {user_id}/**
-- ============================================================================

-- Upload: users can INSERT files under their own user_id folder
CREATE POLICY "Users can upload own work slips"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'work-slips'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Read: users can SELECT (download) files from their own folder
CREATE POLICY "Users can read own work slips"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'work-slips'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update: users can UPDATE files in their own folder (for upsert)
CREATE POLICY "Users can update own work slips"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'work-slips'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete: users can DELETE files from their own folder
CREATE POLICY "Users can delete own work slips"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'work-slips'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
