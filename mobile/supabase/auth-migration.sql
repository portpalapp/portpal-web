-- ============================================================================
-- PORTPAL Auth Migration: Bubble Users → Supabase Auth
--
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- This migration adds the ability to link existing Bubble users to new
-- Supabase Auth accounts. Two flows are supported:
--   1. User has access to their original email → match by email
--   2. User can't access email → verify identity by name + union local
-- ============================================================================


-- 1. Add supabase_user_id column to bubble_users table
--    Links a Bubble user record to a Supabase Auth user (auth.users.id)
ALTER TABLE public.bubble_users
  ADD COLUMN IF NOT EXISTS supabase_user_id uuid UNIQUE;

-- Index for fast lookups by supabase_user_id
CREATE INDEX IF NOT EXISTS idx_bubble_users_supabase_uid
  ON public.bubble_users(supabase_user_id);

-- Index for fast lookups by email (used in migration flow)
CREATE INDEX IF NOT EXISTS idx_bubble_users_email
  ON public.bubble_users(email);


-- 2. Function: link_bubble_user
--    Called after a Bubble user creates a Supabase Auth account.
--    Matches by email and sets the supabase_user_id.
--    Returns true if a match was found and linked, false otherwise.
CREATE OR REPLACE FUNCTION public.link_bubble_user(
  p_email text,
  p_supabase_uid uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_found boolean;
BEGIN
  UPDATE public.bubble_users
  SET supabase_user_id = p_supabase_uid
  WHERE lower(email) = lower(p_email)
    AND supabase_user_id IS NULL;

  GET DIAGNOSTICS v_found = ROW_COUNT;
  RETURN v_found > 0;
END;
$$;


-- 3. Function: verify_bubble_identity
--    For the "can't access my email" flow. Matches by first name, last name,
--    and union local. Returns matching records with masked emails.
--    Only returns users that haven't already been migrated.
CREATE OR REPLACE FUNCTION public.verify_bubble_identity(
  p_first_name text,
  p_last_name text,
  p_union_local text
)
RETURNS TABLE (
  bubble_id text,
  masked_email text,
  first_name text,
  last_name text,
  union_local text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bu.bubble_id,
    -- Mask email: show first char, mask middle, show last char before @, then domain
    -- e.g. "veetesh@gmail.com" → "v*****h@gmail.com"
    CASE
      WHEN bu.email IS NULL OR bu.email = '' THEN '(no email on file)'
      WHEN position('@' in bu.email) <= 2 THEN
        left(bu.email, 1) || '***' || substring(bu.email from position('@' in bu.email))
      ELSE
        left(bu.email, 1)
        || repeat('*', position('@' in bu.email) - 3)
        || substring(bu.email from position('@' in bu.email) - 1 for 1)
        || substring(bu.email from position('@' in bu.email))
    END AS masked_email,
    bu.first_name,
    bu.last_name,
    bu.union_local,
    bu.created_at
  FROM public.bubble_users bu
  WHERE lower(bu.first_name) = lower(p_first_name)
    AND lower(bu.last_name) = lower(p_last_name)
    AND bu.union_local = p_union_local
    AND bu.supabase_user_id IS NULL;
END;
$$;


-- 4. Function: update_bubble_user_email
--    For the "can't access email" flow. After identity is verified,
--    update the Bubble user's email to a new one and link to Supabase Auth.
CREATE OR REPLACE FUNCTION public.update_bubble_user_email(
  p_bubble_id text,
  p_new_email text,
  p_supabase_uid uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_found boolean;
BEGIN
  UPDATE public.bubble_users
  SET email = p_new_email,
      supabase_user_id = p_supabase_uid
  WHERE bubble_id = p_bubble_id
    AND supabase_user_id IS NULL;

  GET DIAGNOSTICS v_found = ROW_COUNT;
  RETURN v_found > 0;
END;
$$;


-- 5. RLS policy: allow the migration functions to be called by anon/authenticated users
--    The functions use SECURITY DEFINER so they run with elevated permissions.
--    No direct table access is granted to anon users.

-- Grant execute on the migration functions to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.link_bubble_user(text, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.verify_bubble_identity(text, text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_bubble_user_email(text, text, uuid) TO authenticated, anon;
