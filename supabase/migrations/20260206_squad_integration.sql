-- =====================================================
-- Squad Integration Migration
-- =====================================================
-- Adds squad synchronization to Courses, Chat, and Calendar
-- =====================================================

-- =====================================================
-- 1. UPGRADE MESSAGES FOR SCOPED CHAT
-- =====================================================
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS squad_id UUID REFERENCES squads(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_messages_squad_id ON messages(squad_id);

COMMENT ON COLUMN messages.squad_id IS 'If set, message belongs to a squad chat room. NULL = global/personal message.';

-- =====================================================
-- 2. UPGRADE COURSES FOR MASTER TEMPLATES
-- =====================================================
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS squad_id UUID REFERENCES squads(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_courses_squad_id ON courses(squad_id);

COMMENT ON COLUMN courses.squad_id IS 'If set, course is shared with the squad. NULL = personal course.';

-- =====================================================
-- 3. CREATE PROGRESS TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS course_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'not_started',
  completed_modules JSONB DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_progress_user_course ON course_progress(user_id, course_id);

COMMENT ON TABLE course_progress IS 'Tracks individual user progress on both personal and squad courses.';

-- =====================================================
-- 4. CREATE STANDARDIZED CALENDAR EVENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  squad_id UUID REFERENCES squads(id) ON DELETE CASCADE, -- Null = Personal
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT DEFAULT 'personal', -- 'personal' or 'squad'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_squad ON calendar_events(squad_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_time ON calendar_events(start_time, end_time);

COMMENT ON TABLE calendar_events IS 'Unified calendar events supporting both personal and squad-shared events.';

-- =====================================================
-- 5. ENABLE RLS ON NEW TABLES
-- =====================================================
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. RLS POLICIES: MESSAGES (CHAT)
-- =====================================================
DROP POLICY IF EXISTS "Everyone can read messages" ON messages;
DROP POLICY IF EXISTS "Read Squad Messages" ON messages;

CREATE POLICY "Read Own or Squad Messages" ON messages
FOR SELECT USING (
  squad_id IN (SELECT get_my_squad_ids_secure()) 
  OR squad_id IS NULL 
  OR user_id = auth.uid()
);

CREATE POLICY "Users can post messages" ON messages
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON messages
FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 7. RLS POLICIES: CALENDAR EVENTS
-- =====================================================
CREATE POLICY "Read Own or Squad Events" ON calendar_events
FOR SELECT USING (
  user_id = auth.uid() 
  OR squad_id IN (SELECT get_my_squad_ids_secure())
);

CREATE POLICY "Manage Own Events" ON calendar_events
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Squad Leaders Manage Squad Events" ON calendar_events
FOR ALL USING (
  squad_id IN (
    SELECT squad_id FROM squad_memberships 
    WHERE user_id = auth.uid() AND role = 'leader'
  )
);

-- =====================================================
-- 8. RLS POLICIES: COURSES
-- =====================================================
DROP POLICY IF EXISTS "Users see own or participating courses" ON courses;
DROP POLICY IF EXISTS "Owner manages courses" ON courses;
DROP POLICY IF EXISTS "Read Own or Squad Courses" ON courses;

CREATE POLICY "Read Own or Squad Courses" ON courses
FOR SELECT USING (
  user_id = auth.uid() 
  OR squad_id IN (SELECT get_my_squad_ids_secure())
);

CREATE POLICY "Manage Own Courses" ON courses
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Squad Leaders Manage Squad Courses" ON courses
FOR ALL USING (
  squad_id IN (
    SELECT squad_id FROM squad_memberships 
    WHERE user_id = auth.uid() AND role = 'leader'
  )
);

-- =====================================================
-- 9. RLS POLICIES: COURSE PROGRESS
-- =====================================================
CREATE POLICY "Manage Own Progress" ON course_progress
FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- 10. HELPER FUNCTION (ENSURE IT EXISTS)
-- =====================================================
-- Note: get_my_squad_ids_secure() should already exist from previous migrations
-- If not, uncomment below:

/*
CREATE OR REPLACE FUNCTION get_my_squad_ids_secure()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT squad_id FROM squad_memberships WHERE user_id = auth.uid();
$$;
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
COMMENT ON SCHEMA public IS 'Squad integration complete: Courses, Messages, and Calendar now support squad-scoped sharing.';
