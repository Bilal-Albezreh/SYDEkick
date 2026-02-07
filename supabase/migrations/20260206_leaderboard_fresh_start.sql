-- =====================================================
-- Leaderboard Fresh Start Migration
-- =====================================================
-- Complete rebuild: Privacy, RLS, and Secure Functions
-- =====================================================

-- 1. Ensure Profile Columns Exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS leaderboard_privacy TEXT DEFAULT 'public' 
CHECK (leaderboard_privacy IN ('public', 'incognito', 'hidden'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- Backfill display_name
UPDATE profiles SET display_name = COALESCE(full_name, 'Member') WHERE display_name IS NULL;

COMMENT ON COLUMN profiles.leaderboard_privacy IS 'Leaderboard visibility: public (name+avatar), incognito (anonymous), hidden (not shown)';
COMMENT ON COLUMN profiles.display_name IS 'User display name for leaderboard and social features';
COMMENT ON COLUMN profiles.xp IS 'Experience points earned through task completion and study time';

-- Add index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp DESC);

-- =====================================================
-- 2. The "Circuit Breaker" Function (Prevents Infinite Recursion)
-- =====================================================
CREATE OR REPLACE FUNCTION get_my_squad_ids_secure()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT squad_id FROM squad_memberships WHERE user_id = auth.uid();
$$;

COMMENT ON FUNCTION get_my_squad_ids_secure IS 'Securely returns squad IDs for current user, prevents RLS recursion';

-- =====================================================
-- 3. The RLS Policies (Group-Scoped Visibility)
-- =====================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view squadmate profiles" ON profiles;
DROP POLICY IF EXISTS "Read Squadmate Profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Policy A: Users can always view their own profile
CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT USING (auth.uid() = id);

-- Policy B: Users can view profiles of their squadmates (using secure function)
CREATE POLICY "Users can view squadmate profiles" ON profiles 
FOR SELECT USING (
    id IN (
        SELECT user_id 
        FROM squad_memberships 
        WHERE squad_id IN (SELECT get_my_squad_ids_secure())
    )
);

-- Policy C: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (auth.uid() = id);

-- Policy D: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- CLEANUP
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles with leaderboard privacy and squad member visibility via RLS';
