-- =====================================================
-- Leaderboard Privacy & Display Name Migration
-- =====================================================
-- Migration: 20260206_leaderboard_privacy_and_rls
-- Adds privacy controls and fixes RLS for group-scoped leaderboard
-- =====================================================

-- 1. Add Privacy Settings Column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS leaderboard_privacy TEXT DEFAULT 'public' 
CHECK (leaderboard_privacy IN ('public', 'incognito', 'hidden'));

COMMENT ON COLUMN profiles.leaderboard_privacy IS 'Leaderboard visibility: public (name+avatar), incognito (anonymous), hidden (not shown)';

-- 2. Add Display Name Column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Backfill display_name from full_name if it exists, otherwise use 'Member'
UPDATE profiles 
SET display_name = COALESCE(full_name, 'Member') 
WHERE display_name IS NULL;

COMMENT ON COLUMN profiles.display_name IS 'User display name for leaderboard and social features';

-- 3. Add XP Column (if not exists)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0 NOT NULL;

COMMENT ON COLUMN profiles.xp IS 'Experience points earned through task completion and study time';

-- 4. Add Index for Leaderboard Queries
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp DESC);

-- =====================================================
-- RLS POLICIES: Allow Squadmates to See Each Other
-- =====================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Read Squadmate Profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Policy 1: Users can always view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can view profiles of their squadmates
CREATE POLICY "Users can view squadmate profiles"
ON profiles FOR SELECT
USING (
    id IN (
        SELECT sm.user_id 
        FROM squad_memberships sm
        WHERE sm.squad_id IN (
            SELECT squad_id 
            FROM squad_memberships 
            WHERE user_id = auth.uid()
        )
    )
);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy 4: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- =====================================================
-- CLEANUP
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles with leaderboard privacy and squad member visibility via RLS';
