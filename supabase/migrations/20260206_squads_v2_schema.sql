-- =====================================================
-- SQUADS V2: Smart Overlay Architecture
-- =====================================================
-- Design Pattern: Shared Templates + Private States
-- Created: 2026-02-06
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
-- Extended user metadata for squad features
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    program TEXT,
    term TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. SQUADS TABLE
-- =====================================================
-- Groups that share a common schedule/template
CREATE TABLE IF NOT EXISTS squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text) from 1 for 8),
    is_official BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast invite code lookups
CREATE INDEX IF NOT EXISTS idx_squads_invite_code ON squads(invite_code);
CREATE INDEX IF NOT EXISTS idx_squads_owner ON squads(owner_id);

-- =====================================================
-- 3. SQUAD MEMBERSHIPS TABLE
-- =====================================================
-- Junction table: Users <-> Squads with roles
CREATE TABLE IF NOT EXISTS squad_memberships (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('leader', 'member')) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (user_id, squad_id),
    UNIQUE (user_id, squad_id)
);

CREATE INDEX IF NOT EXISTS idx_squad_memberships_user ON squad_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_squad_memberships_squad ON squad_memberships(squad_id);

-- =====================================================
-- 4. SQUAD TEMPLATES TABLE
-- =====================================================
-- Master copies of assignments/exams shared across squad
CREATE TABLE IF NOT EXISTS squad_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    weight NUMERIC(5,2), -- Percentage weight (0-100)
    type TEXT CHECK (type IN ('assignment', 'exam', 'quiz', 'project', 'other')),
    is_archived BOOLEAN DEFAULT false, -- Soft delete to prevent orphaning user data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_squad_templates_squad ON squad_templates(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_templates_active ON squad_templates(squad_id, is_archived) WHERE is_archived = false;

-- =====================================================
-- 5. USER TASK STATES TABLE (THE OVERLAY)
-- =====================================================
-- Private user data: grades, custom dates, status
-- This is where individual users store THEIR version of squad tasks
CREATE TABLE IF NOT EXISTS user_task_states (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES squad_templates(id) ON DELETE CASCADE,
    
    -- User overrides (nullable = use template default)
    custom_title TEXT,
    custom_date TIMESTAMPTZ,
    custom_weight NUMERIC(5,2),
    
    -- Private user data
    status TEXT CHECK (status IN ('pending', 'completed', 'late')) DEFAULT 'pending',
    grade NUMERIC(5,2), -- User's grade (0-100)
    notes TEXT,
    
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (user_id, template_id),
    UNIQUE (user_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_user_task_states_user ON user_task_states(user_id);
CREATE INDEX IF NOT EXISTS idx_user_task_states_template ON user_task_states(template_id);

-- =====================================================
-- 6. PERSONAL TASKS TABLE
-- =====================================================
-- Solo mode tasks that don't belong to any squad
CREATE TABLE IF NOT EXISTS personal_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    status TEXT CHECK (status IN ('pending', 'completed', 'late')) DEFAULT 'pending',
    grade NUMERIC(5,2),
    notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_tasks_user ON personal_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_due_date ON personal_tasks(user_id, due_date);

-- =====================================================
-- 7. MASTER CALENDAR VIEW (THE MAGIC)
-- =====================================================
-- Automatically merges squad templates + user overrides + personal tasks
-- Frontend can just query this single view!
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
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES: Users can read/update their own profile
-- =====================================================
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- SQUADS: Members can read, owners can write
-- =====================================================
CREATE POLICY "Anyone can view public squads or squads they're in"
    ON squads FOR SELECT
    USING (
        is_official = true 
        OR owner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM squad_memberships 
            WHERE squad_id = squads.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can create a squad"
    ON squads FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Only owners can update their squad"
    ON squads FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Only owners can delete their squad"
    ON squads FOR DELETE
    USING (auth.uid() = owner_id);

-- =====================================================
-- SQUAD MEMBERSHIPS: Members can read, leaders manage
-- =====================================================
CREATE POLICY "Users can view memberships of squads they're in"
    ON squad_memberships FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM squad_memberships sm2
            WHERE sm2.squad_id = squad_memberships.squad_id 
            AND sm2.user_id = auth.uid()
        )
    );

CREATE POLICY "Squad leaders can add members"
    ON squad_memberships FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM squad_memberships
            WHERE squad_id = squad_memberships.squad_id
            AND user_id = auth.uid()
            AND role = 'leader'
        )
        OR EXISTS (
            SELECT 1 FROM squads
            WHERE id = squad_memberships.squad_id
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Squad leaders can remove members"
    ON squad_memberships FOR DELETE
    USING (
        user_id = auth.uid() -- Users can leave
        OR EXISTS (
            SELECT 1 FROM squad_memberships sm2
            WHERE sm2.squad_id = squad_memberships.squad_id
            AND sm2.user_id = auth.uid()
            AND sm2.role = 'leader'
        )
        OR EXISTS (
            SELECT 1 FROM squads
            WHERE id = squad_memberships.squad_id
            AND owner_id = auth.uid()
        )
    );

-- =====================================================
-- SQUAD TEMPLATES: Public read for members, leader write
-- =====================================================
CREATE POLICY "Squad members can view templates"
    ON squad_templates FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM squad_memberships
            WHERE squad_id = squad_templates.squad_id
            AND user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM squads
            WHERE id = squad_templates.squad_id
            AND (is_official = true OR owner_id = auth.uid())
        )
    );

CREATE POLICY "Squad leaders can create templates"
    ON squad_templates FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM squad_memberships
            WHERE squad_id = squad_templates.squad_id
            AND user_id = auth.uid()
            AND role = 'leader'
        )
        OR EXISTS (
            SELECT 1 FROM squads
            WHERE id = squad_templates.squad_id
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Squad leaders can update templates"
    ON squad_templates FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM squad_memberships
            WHERE squad_id = squad_templates.squad_id
            AND user_id = auth.uid()
            AND role = 'leader'
        )
        OR EXISTS (
            SELECT 1 FROM squads
            WHERE id = squad_templates.squad_id
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Squad leaders can archive templates"
    ON squad_templates FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM squad_memberships
            WHERE squad_id = squad_templates.squad_id
            AND user_id = auth.uid()
            AND role = 'leader'
        )
        OR EXISTS (
            SELECT 1 FROM squads
            WHERE id = squad_templates.squad_id
            AND owner_id = auth.uid()
        )
    );

-- =====================================================
-- USER TASK STATES: 100% PRIVATE to each user
-- =====================================================
-- CRITICAL: Leaders CANNOT see grades/status of other users
CREATE POLICY "Users can only view their own task states"
    ON user_task_states FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own task states"
    ON user_task_states FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own task states"
    ON user_task_states FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own task states"
    ON user_task_states FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- PERSONAL TASKS: 100% private to user
-- =====================================================
CREATE POLICY "Users can only view their own personal tasks"
    ON personal_tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own personal tasks"
    ON personal_tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own personal tasks"
    ON personal_tasks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own personal tasks"
    ON personal_tasks FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS FOR updated_at columns
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_squads_updated_at BEFORE UPDATE ON squads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_squad_templates_updated_at BEFORE UPDATE ON squad_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_task_states_updated_at BEFORE UPDATE ON user_task_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_tasks_updated_at BEFORE UPDATE ON personal_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- END OF MIGRATION
-- =====================================================
-- Usage Example:
-- 1. Create squad: INSERT INTO squads (name, owner_id) VALUES ('SYDE 2B', auth.uid())
-- 2. Add members: INSERT INTO squad_memberships (user_id, squad_id, role) VALUES (...)
-- 3. Create template: INSERT INTO squad_templates (squad_id, title, due_date) VALUES (...)
-- 4. User sets grade: INSERT INTO user_task_states (user_id, template_id, grade, status) VALUES (...)
-- 5. Query calendar: SELECT * FROM master_calendar_view WHERE user_id = auth.uid()
-- =====================================================
