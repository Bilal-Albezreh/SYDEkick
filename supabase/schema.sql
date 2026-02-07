-- =======================================================
-- 1. TABLES (CURRENT STATE)
-- =======================================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  leaderboard_privacy TEXT DEFAULT 'public',
  display_name TEXT,
  xp INTEGER DEFAULT 0,
  is_participating BOOLEAN DEFAULT false
);

CREATE TABLE squads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users,
  name TEXT,
  description TEXT
);

CREATE TABLE squad_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  squad_id REFERENCES squads,
  role TEXT DEFAULT 'member'
);

CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  course_code TEXT,
  course_name TEXT,
  color TEXT,
  grading_rules JSONB,
  term_id UUID,
  target_grade NUMERIC
);

CREATE TABLE assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses,
  user_id UUID REFERENCES auth.users,
  name TEXT,
  weight NUMERIC,
  score NUMERIC,
  total_marks NUMERIC,
  due_date TIMESTAMPTZ,
  is_completed BOOLEAN
);

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  topic TEXT,
  content TEXT,
  extension TEXT,
  payload JSONB,
  event TEXT,
  private BOOLEAN DEFAULT false,
  inserted_at TIMESTAMP DEFAULT now()
);

CREATE TABLE personal_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  title TEXT,
  description TEXT,
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending'
);

CREATE TABLE calendar_events (
  -- NOTE: This table is missing from your dump, we will create it
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  title TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
);

-- =======================================================
-- 2. RLS POLICIES (CURRENT STATE)
-- =======================================================

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- SQUADS & MEMBERSHIPS
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read Squads I Belong To" ON squads FOR SELECT USING (
  id IN (SELECT get_my_squad_ids_secure())
);

ALTER TABLE squad_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read Own Membership" ON squad_memberships FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Read Team Memberships" ON squad_memberships FOR SELECT USING (
  squad_id IN (SELECT get_my_squad_ids_secure())
);

-- COURSES
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own or participating courses" ON courses FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = courses.user_id AND profiles.is_participating = true)
);
CREATE POLICY "Owner manages courses" ON courses FOR ALL USING (auth.uid() = user_id);

-- MESSAGES (The Global Chat Issue)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Users can post messages" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ASSESSMENTS & TASKS
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own assessments" ON assessments FOR ALL USING (auth.uid() = user_id);

ALTER TABLE personal_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON personal_tasks FOR ALL USING (auth.uid() = user_id);