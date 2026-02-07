-- =====================================================
-- SQUADS V2 REFINEMENT: Single Squad + Categories
-- =====================================================
-- Changes:
-- 1. Enforce single squad membership per user
-- 2. Add program/term context to squads
-- 3. Add category (academic/social) to templates
-- 4. Add squad messaging table
-- =====================================================
-- Created: 2026-02-06
-- =====================================================

-- =====================================================
-- 1. ADD PROGRAM/TERM TO SQUADS
-- =====================================================
-- Add context columns to squads table
ALTER TABLE squads 
ADD COLUMN IF NOT EXISTS program TEXT,
ADD COLUMN IF NOT EXISTS term TEXT;

-- Add index for filtering squads by program/term
CREATE INDEX IF NOT EXISTS idx_squads_program_term 
ON squads(program, term) 
WHERE program IS NOT NULL;

-- =====================================================
-- 2. ENFORCE SINGLE SQUAD MEMBERSHIP
-- =====================================================
-- CRITICAL: Each user can only be in ONE squad
-- Drop existing unique constraint if it exists (from previous schema)
ALTER TABLE squad_memberships 
DROP CONSTRAINT IF EXISTS squad_memberships_user_id_squad_id_key;

-- Add new UNIQUE constraint on user_id only
-- This ensures one row per user = one squad membership
ALTER TABLE squad_memberships 
ADD CONSTRAINT squad_memberships_user_id_unique 
UNIQUE (user_id);

-- =====================================================
-- 3. ADD CATEGORY TO SQUAD TEMPLATES
-- =====================================================
-- Add category column with constraint
ALTER TABLE squad_templates 
ADD COLUMN IF NOT EXISTS category TEXT 
DEFAULT 'academic' 
CHECK (category IN ('academic', 'social'));

-- Update existing rows to have 'academic' category
UPDATE squad_templates 
SET category = 'academic' 
WHERE category IS NULL;

-- Add index for filtering by category
CREATE INDEX IF NOT EXISTS idx_squad_templates_category 
ON squad_templates(squad_id, category, is_archived) 
WHERE is_archived = false;

-- =====================================================
-- 4. CREATE SQUAD MESSAGES TABLE
-- =====================================================
-- Real-time squad chat
CREATE TABLE IF NOT EXISTS squad_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 2000),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_squad_messages_squad 
ON squad_messages(squad_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_squad_messages_user 
ON squad_messages(user_id, created_at DESC);

-- =====================================================
-- 5. RLS POLICIES FOR SQUAD MESSAGES
-- =====================================================
-- Enable RLS
ALTER TABLE squad_messages ENABLE ROW LEVEL SECURITY;

-- Members can view messages from their squad
CREATE POLICY "Squad members can view messages"
    ON squad_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM squad_memberships
            WHERE squad_id = squad_messages.squad_id
            AND user_id = auth.uid()
        )
    );

-- Members can send messages to their squad
CREATE POLICY "Squad members can send messages"
    ON squad_messages FOR INSERT
    WITH CHECK (
        -- User must be a member of this squad
        EXISTS (
            SELECT 1 FROM squad_memberships
            WHERE squad_id = squad_messages.squad_id
            AND user_id = auth.uid()
        )
        -- User can only send as themselves
        AND auth.uid() = squad_messages.user_id
    );

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
    ON squad_messages FOR DELETE
    USING (auth.uid() = user_id);

-- Squad leaders can delete any message in their squad
CREATE POLICY "Squad leaders can delete messages"
    ON squad_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM squad_memberships
            WHERE squad_id = squad_messages.squad_id
            AND user_id = auth.uid()
            AND role = 'leader'
        )
        OR EXISTS (
            SELECT 1 FROM squads
            WHERE id = squad_messages.squad_id
            AND owner_id = auth.uid()
        )
    );

-- =====================================================
-- 6. UPDATE MASTER CALENDAR VIEW (Optional Enhancement)
-- =====================================================
-- Recreate view to include category field
DROP VIEW IF EXISTS master_calendar_view;

CREATE OR REPLACE VIEW master_calendar_view AS
-- Part 1: Squad Items (with user overrides)
SELECT 
    st.id as template_id,
    uts.user_id,
    sm.squad_id,
    s.name as squad_name,
    
    -- Use custom values if set, otherwise template defaults
    COALESCE(uts.custom_title, st.title) as display_title,
    COALESCE(uts.custom_date, st.due_date) as display_date,
    COALESCE(uts.custom_weight, st.weight) as display_weight,
    
    st.type,
    st.category, -- NEW: Include category
    st.description,
    
    -- User's private data
    COALESCE(uts.status, 'pending') as status,
    uts.grade,
    uts.notes,
    uts.completed_at,
    
    -- Metadata
    false as is_personal,
    st.is_archived,
    st.created_at,
    GREATEST(st.updated_at, uts.updated_at) as updated_at
    
FROM squad_templates st
INNER JOIN squads s ON st.squad_id = s.id
INNER JOIN squad_memberships sm ON sm.squad_id = s.id
LEFT JOIN user_task_states uts ON uts.template_id = st.id AND uts.user_id = sm.user_id
WHERE st.is_archived = false

UNION ALL

-- Part 2: Personal Tasks (solo mode)
SELECT 
    pt.id as template_id,
    pt.user_id,
    NULL as squad_id,
    NULL as squad_name,
    
    pt.title as display_title,
    pt.due_date as display_date,
    NULL as display_weight,
    
    'personal' as type,
    'academic' as category, -- Default personal tasks to academic
    pt.description,
    
    pt.status,
    pt.grade,
    pt.notes,
    pt.completed_at,
    
    true as is_personal,
    false as is_archived,
    pt.created_at,
    pt.updated_at
    
FROM personal_tasks pt;

-- =====================================================
-- 7. HELPER FUNCTION: GET USER'S SQUAD
-- =====================================================
-- Utility function to check if user is in a squad
CREATE OR REPLACE FUNCTION get_user_squad_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
    SELECT squad_id 
    FROM squad_memberships 
    WHERE user_id = p_user_id
    LIMIT 1;
$$;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
-- Breaking Changes:
-- - Users can now only be in ONE squad
-- - Existing users with multiple memberships need manual cleanup
-- - All templates now require a category

-- To check for users with multiple squads (before applying):
-- SELECT user_id, COUNT(*) as squad_count 
-- FROM squad_memberships 
-- GROUP BY user_id 
-- HAVING COUNT(*) > 1;
-- =====================================================
