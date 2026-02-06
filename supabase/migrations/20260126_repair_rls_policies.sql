-- =============================================
-- REPAIR SCRIPT: Phase 2 Onboarding Issues
-- Migration: 20260126_repair_rls_policies
-- =============================================

-- =============================================
-- ISSUE 1: MISSING PROFILES UPDATE POLICY
-- =============================================
-- The setupUserTerm action tries to UPDATE profiles table
-- but there's no RLS policy allowing authenticated users to update their own profile

-- Check if RLS is enabled on profiles
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- Add missing UPDATE policy for profiles
DO $$
BEGIN
    -- Drop if exists (to make migration idempotent)
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update own profile'
    ) THEN
        DROP POLICY "Users can update own profile" ON "public"."profiles";
    END IF;
END $$;

CREATE POLICY "Users can update own profile"
ON "public"."profiles" FOR UPDATE
TO authenticated
USING (auth.uid() = "id")
WITH CHECK (auth.uid() = "id");

COMMENT ON POLICY "Users can update own profile" ON "public"."profiles" 
IS 'Allows authenticated users to update their own profile';

-- =============================================
-- VERIFICATION HELPER
-- =============================================
-- Run this query to verify policies are working:
-- SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'terms', 'courses');

COMMENT ON SCHEMA public IS 'Phase 2 Repair: RLS policies fixed for onboarding flow.';
