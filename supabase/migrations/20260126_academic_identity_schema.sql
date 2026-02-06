-- =============================================
-- Phase 2.1: Academic Identity & Terms System
-- Migration: 20260126_academic_identity_schema
-- =============================================

-- =============================================
-- SECTION 1: IDENTITY TABLES (PUBLIC LIBRARY)
-- =============================================

-- 1A. UNIVERSITIES TABLE
CREATE TABLE IF NOT EXISTS "public"."universities" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert University of Waterloo
INSERT INTO "public"."universities" ("name") 
VALUES ('University of Waterloo')
ON CONFLICT ("name") DO NOTHING;

-- 1B. PROGRAMS TABLE
CREATE TABLE IF NOT EXISTS "public"."programs" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "university_id" UUID NOT NULL REFERENCES "public"."universities"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE ("university_id", "name")
);

-- Seed Programs for University of Waterloo
DO $$
DECLARE
    uwaterloo_id UUID;
    program_names TEXT[] := ARRAY[
        'Accounting and Financial Management',
        'Actuarial Science',
        'Anthropology',
        'Applied Mathematics',
        'Architectural Engineering',
        'Architecture',
        'Biomedical Engineering',
        'Biochemistry',
        'Biology',
        'Biomedical Sciences',
        'Biostatistics',
        'Business Administration (Laurier) and Computer Science (Waterloo) Double Degree',
        'Business Administration (Laurier) and Mathematics (Waterloo) Double Degree',
        'Chemical Engineering',
        'Chemistry',
        'Civil Engineering',
        'Classical Studies',
        'Climate and Environmental Change',
        'Combinatorics and Optimization',
        'Communication Studies',
        'Computational Mathematics',
        'Computer Engineering',
        'Computer Science',
        'Computing and Financial Management',
        'Data Science',
        'Earth Sciences',
        'Economics',
        'Electrical Engineering',
        'English',
        'Environment and Business',
        'Environmental Engineering',
        'Environmental Sciences',
        'Fine Arts',
        'French',
        'Gender and Social Justice',
        'Geography and Aviation',
        'Geography and Environmental Management',
        'Geological Engineering',
        'Geomatics',
        'Global Business and Digital Arts',
        'Health Sciences',
        'History',
        'Honours Arts',
        'Honours Science',
        'Information Technology Management',
        'Kinesiology',
        'Legal Studies',
        'Liberal Studies',
        'Life Sciences',
        'Management Engineering',
        'Materials and Nanosciences',
        'Mathematical Economics',
        'Mathematical Finance',
        'Mathematical Optimization',
        'Mathematical Physics',
        'Mathematical Studies',
        'Mathematics',
        'Mechanical Engineering',
        'Mechatronics Engineering',
        'Medicinal Chemistry',
        'Medieval Studies',
        'Music',
        'Nanotechnology Engineering',
        'Optometry',
        'Peace and Conflict Studies',
        'Pharmacy',
        'Philosophy',
        'Physics',
        'Physics and Astronomy',
        'Planning',
        'Political Science',
        'Psychology',
        'Public Health',
        'Pure Mathematics',
        'Recreation and Leisure Studies',
        'Religious Studies',
        'Science and Aviation',
        'Science and Business',
        'Social Development Studies',
        'Social Work',
        'Sociology',
        'Software Engineering',
        'Statistics',
        'Sustainability and Financial Management',
        'Systems Design Engineering',
        'Theatre and Performance',
        'Therapeutic Recreation'
    ];
    program_name TEXT;
BEGIN
    -- Get University of Waterloo ID
    SELECT "id" INTO uwaterloo_id 
    FROM "public"."universities" 
    WHERE "name" = 'University of Waterloo';

    -- Insert each program
    FOREACH program_name IN ARRAY program_names
    LOOP
        INSERT INTO "public"."programs" ("university_id", "name")
        VALUES (uwaterloo_id, program_name)
        ON CONFLICT ("university_id", "name") DO NOTHING;
    END LOOP;
END $$;

-- 1C. MASTER TERMS TABLE (Template Blueprint)
CREATE TABLE IF NOT EXISTS "public"."master_terms" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "program_id" UUID NOT NULL REFERENCES "public"."programs"("id") ON DELETE CASCADE,
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE ("program_id", "label")
);

COMMENT ON TABLE "public"."master_terms" IS 'Template structure for program terms (e.g., 1A, 1B, 2A). Used as blueprint for user terms.';

-- =============================================
-- SECTION 2: USER TABLES (PRIVATE DATA)
-- =============================================

-- 2A. UPDATE PROFILES TABLE
ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "university_id" UUID REFERENCES "public"."universities"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "program_id" UUID REFERENCES "public"."programs"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "current_term_label" TEXT;

-- 2B. CREATE TERMS TABLE (User's Term Container)
CREATE TABLE IF NOT EXISTS "public"."terms" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
    "label" TEXT NOT NULL,
    "season" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "is_current" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE ("user_id", "label")
);

COMMENT ON TABLE "public"."terms" IS 'User-specific academic terms (e.g., 2B Winter 2026). Each user builds their own term timeline.';

-- 2C. UPDATE COURSES TABLE
ALTER TABLE "public"."courses"
ADD COLUMN IF NOT EXISTS "term_id" UUID REFERENCES "public"."terms"("id") ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS "target_grade" NUMERIC(5,2);

COMMENT ON COLUMN "public"."courses"."term_id" IS 'Links course to a specific term. Cascade delete if term is removed.';
COMMENT ON COLUMN "public"."courses"."target_grade" IS 'User-defined target grade for this course (0-100).';

-- =============================================
-- SECTION 3: SECURITY TRIGGERS (ANTI-SPAM)
-- =============================================

-- 3A. TRIGGER 1: MAX 8 COURSES PER TERM
CREATE OR REPLACE FUNCTION enforce_max_courses_per_term()
RETURNS TRIGGER AS $$
DECLARE
    course_count INT;
BEGIN
    -- Count existing active courses in this term for this user
    SELECT COUNT(*) INTO course_count
    FROM "public"."courses"
    WHERE "term_id" = NEW."term_id"
    AND "user_id" = NEW."user_id";

    -- Raise exception if limit exceeded
    IF course_count >= 8 THEN
        RAISE EXCEPTION 'Maximum 8 courses allowed per term. Please remove a course before adding a new one.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_max_courses_per_term ON "public"."courses";
CREATE TRIGGER trigger_max_courses_per_term
BEFORE INSERT ON "public"."courses"
FOR EACH ROW
EXECUTE FUNCTION enforce_max_courses_per_term();

-- 3B. TRIGGER 2: MAX 25 ASSESSMENTS PER COURSE
CREATE OR REPLACE FUNCTION enforce_max_assessments_per_course()
RETURNS TRIGGER AS $$
DECLARE
    assessment_count INT;
BEGIN
    -- Count existing assessments for this course
    SELECT COUNT(*) INTO assessment_count
    FROM "public"."assessments"
    WHERE "course_id" = NEW."course_id";

    -- Raise exception if limit exceeded
    IF assessment_count >= 25 THEN
        RAISE EXCEPTION 'Maximum 25 assessments allowed per course. Please remove an assessment before adding a new one.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_max_assessments_per_course ON "public"."assessments";
CREATE TRIGGER trigger_max_assessments_per_course
BEFORE INSERT ON "public"."assessments"
FOR EACH ROW
EXECUTE FUNCTION enforce_max_assessments_per_course();

-- 3C. TRIGGER 3: SINGLE CURRENT TERM PER USER
CREATE OR REPLACE FUNCTION enforce_single_current_term()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a term as current, unset all other terms for this user
    IF NEW."is_current" = TRUE THEN
        UPDATE "public"."terms"
        SET "is_current" = FALSE
        WHERE "user_id" = NEW."user_id"
        AND "id" != NEW."id";
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_single_current_term ON "public"."terms";
CREATE TRIGGER trigger_single_current_term
BEFORE INSERT OR UPDATE ON "public"."terms"
FOR EACH ROW
WHEN (NEW."is_current" = TRUE)
EXECUTE FUNCTION enforce_single_current_term();

-- =============================================
-- SECTION 4: ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on new tables
ALTER TABLE "public"."universities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."programs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."master_terms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."terms" ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Universities (Public Read)
CREATE POLICY "Public read access to universities"
ON "public"."universities" FOR SELECT
TO authenticated
USING (true);

-- RLS Policies: Programs (Public Read)
CREATE POLICY "Public read access to programs"
ON "public"."programs" FOR SELECT
TO authenticated
USING (true);

-- RLS Policies: Master Terms (Public Read)
CREATE POLICY "Public read access to master_terms"
ON "public"."master_terms" FOR SELECT
TO authenticated
USING (true);

-- RLS Policies: Terms (User owns their own terms)
CREATE POLICY "Users can view own terms"
ON "public"."terms" FOR SELECT
TO authenticated
USING (auth.uid() = "user_id");

CREATE POLICY "Users can insert own terms"
ON "public"."terms" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "Users can update own terms"
ON "public"."terms" FOR UPDATE
TO authenticated
USING (auth.uid() = "user_id")
WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "Users can delete own terms"
ON "public"."terms" FOR DELETE
TO authenticated
USING (auth.uid() = "user_id");

-- =============================================
-- SECTION 5: INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_programs_university_id ON "public"."programs"("university_id");
CREATE INDEX IF NOT EXISTS idx_master_terms_program_id ON "public"."master_terms"("program_id");
CREATE INDEX IF NOT EXISTS idx_profiles_university_id ON "public"."profiles"("university_id");
CREATE INDEX IF NOT EXISTS idx_profiles_program_id ON "public"."profiles"("program_id");
CREATE INDEX IF NOT EXISTS idx_terms_user_id ON "public"."terms"("user_id");
CREATE INDEX IF NOT EXISTS idx_terms_is_current ON "public"."terms"("is_current") WHERE "is_current" = TRUE;
CREATE INDEX IF NOT EXISTS idx_courses_term_id ON "public"."courses"("term_id");

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

COMMENT ON SCHEMA public IS 'Phase 2.1: Academic Identity & Terms System - Migration completed successfully.';
