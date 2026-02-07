-- =====================================================
-- Snapshot & Clone System: Master Template Migration
-- =====================================================
-- Creates immutable templates for squad courses
-- Enables "fork on join" functionality
-- =====================================================

-- =====================================================
-- 1. CREATE MASTER TERMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS master_terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  squad_id UUID REFERENCES squads(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL, -- e.g. "Fall 2024", "Winter 2025"
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(squad_id, label)
);

ALTER TABLE master_terms ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_master_terms_squad ON master_terms(squad_id);

COMMENT ON TABLE master_terms IS 'Immutable term templates for squad curriculum organization.';

-- =====================================================
-- 2. CREATE MASTER COURSES TABLE (Templates)
-- =====================================================
CREATE TABLE IF NOT EXISTS master_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  squad_id UUID REFERENCES squads(id) ON DELETE CASCADE NOT NULL,
  master_term_id UUID REFERENCES master_terms(id) ON DELETE SET NULL,
  code TEXT NOT NULL, -- e.g. "MATH 115"
  name TEXT NOT NULL, -- e.g. "Linear Algebra"
  color TEXT DEFAULT '#4F46E5',
  default_credits NUMERIC DEFAULT 0.5,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) -- Track who created the template
);

ALTER TABLE master_courses ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_master_courses_squad ON master_courses(squad_id);

COMMENT ON TABLE master_courses IS 'Immutable course templates. When a user joins a squad, these get cloned into their courses table.';

-- =====================================================
-- 3. CREATE MASTER ASSESSMENTS TABLE (Template Components)
-- =====================================================
CREATE TABLE IF NOT EXISTS master_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  master_course_id UUID REFERENCES master_courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL, -- e.g. "Midterm 1"
  weight NUMERIC NOT NULL, -- e.g. 30 (%)
  default_due_offset_days INTEGER, -- Days after term start
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE master_assessments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_master_assessments_course ON master_assessments(master_course_id);

COMMENT ON TABLE master_assessments IS 'Immutable assessment templates linked to master courses.';

-- =====================================================
-- 4. UPDATE COURSES TABLE (Add Template Link)
-- =====================================================
ALTER TABLE courses ADD COLUMN IF NOT EXISTS master_course_id UUID REFERENCES master_courses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_courses_master ON courses(master_course_id);

COMMENT ON COLUMN courses.master_course_id IS 'Links to the master template this course was cloned from. NULL = standalone course.';
COMMENT ON COLUMN courses.squad_id IS 'DEPRECATED: Use master_course_id instead. Kept for backward compatibility.';

-- =====================================================
-- 5. UPDATE ASSESSMENTS TABLE (Add Template Link)
-- =====================================================
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS master_assessment_id UUID REFERENCES master_assessments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assessments_master ON assessments(master_assessment_id);

COMMENT ON COLUMN assessments.master_assessment_id IS 'Links to the master template this assessment was cloned from. NULL = standalone assessment.';

-- =====================================================
-- 6. RLS POLICIES: MASTER TERMS
-- =====================================================
CREATE POLICY "Read Master Terms from Own Squad" ON master_terms
FOR SELECT USING (
  squad_id IN (SELECT get_my_squad_ids_secure())
);

CREATE POLICY "Squad Leaders Manage Master Terms" ON master_terms
FOR ALL USING (
  squad_id IN (
    SELECT squad_id FROM squad_memberships 
    WHERE user_id = auth.uid() AND role = 'leader'
  )
);

-- =====================================================
-- 7. RLS POLICIES: MASTER COURSES
-- =====================================================
CREATE POLICY "Read Master Courses from Own Squad" ON master_courses
FOR SELECT USING (
  squad_id IN (SELECT get_my_squad_ids_secure())
);

CREATE POLICY "Squad Leaders Manage Master Courses" ON master_courses
FOR ALL USING (
  squad_id IN (
    SELECT squad_id FROM squad_memberships 
    WHERE user_id = auth.uid() AND role = 'leader'
  )
);

-- =====================================================
-- 8. RLS POLICIES: MASTER ASSESSMENTS
-- =====================================================
CREATE POLICY "Read Master Assessments from Squad Courses" ON master_assessments
FOR SELECT USING (
  master_course_id IN (
    SELECT id FROM master_courses 
    WHERE squad_id IN (SELECT get_my_squad_ids_secure())
  )
);

CREATE POLICY "Squad Leaders Manage Master Assessments" ON master_assessments
FOR ALL USING (
  master_course_id IN (
    SELECT id FROM master_courses WHERE squad_id IN (
      SELECT squad_id FROM squad_memberships 
      WHERE user_id = auth.uid() AND role = 'leader'
    )
  )
);

-- =====================================================
-- 9. AUTO-CLONE TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION clone_squad_curriculum_for_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  master_course_record RECORD;
  master_assessment_record RECORD;
  new_course_id UUID;
BEGIN
  -- Only clone for regular members (leaders handle their own courses)
  IF NEW.role = 'member' THEN
    
    -- Loop through all master courses for this squad
    FOR master_course_record IN 
      SELECT * FROM master_courses WHERE squad_id = NEW.squad_id
    LOOP
      
      -- Clone the course into member's courses table
      INSERT INTO courses (
        user_id,
        course_code,
        course_name,
        color,
        grading_rules,
        master_course_id
      )
      VALUES (
        NEW.user_id,
        master_course_record.code,
        master_course_record.name,
        master_course_record.color,
        '{}', -- Empty grading rules initially
        master_course_record.id -- Link back to master
      )
      RETURNING id INTO new_course_id;
      
      -- Clone all assessments for this course
      FOR master_assessment_record IN
        SELECT * FROM master_assessments WHERE master_course_id = master_course_record.id
      LOOP
        
        INSERT INTO assessments (
          course_id,
          user_id,
          name,
          weight,
          master_assessment_id
        )
        VALUES (
          new_course_id,
          NEW.user_id,
          master_assessment_record.title,
          master_assessment_record.weight,
          master_assessment_record.id -- Link back to master
        );
        
      END LOOP; -- assessments loop
      
    END LOOP; -- courses loop
    
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION clone_squad_curriculum_for_member IS 'Auto-clones squad curriculum when a new member joins. Uses SECURITY DEFINER to bypass RLS.';

-- =====================================================
-- 10. ATTACH TRIGGER TO SQUAD_MEMBERSHIPS
-- =====================================================
DROP TRIGGER IF EXISTS trigger_clone_curriculum ON squad_memberships;

CREATE TRIGGER trigger_clone_curriculum
  AFTER INSERT ON squad_memberships
  FOR EACH ROW
  EXECUTE FUNCTION clone_squad_curriculum_for_member();

COMMENT ON TRIGGER trigger_clone_curriculum ON squad_memberships IS 'Automatically clones squad curriculum when a new member joins.';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
COMMENT ON SCHEMA public IS 'Snapshot & Clone system active: Courses are now templated and auto-cloned for new squad members.';
