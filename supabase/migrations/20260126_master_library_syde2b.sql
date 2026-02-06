-- =============================================
-- Phase 2.2: Master Library (Read-Only Templates)
-- Migration: 20260126_master_library_syde2b
-- =============================================

-- =============================================
-- SECTION 1: MASTER LIBRARY TABLES
-- =============================================

-- 1A. MASTER COURSES TABLE
CREATE TABLE IF NOT EXISTS "public"."master_courses" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "master_term_id" UUID NOT NULL REFERENCES "public"."master_terms"("id") ON DELETE CASCADE,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "default_credits" NUMERIC(3,2) DEFAULT 0.5,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE ("master_term_id", "code")
);

COMMENT ON TABLE "public"."master_courses" IS 'Template courses (read-only). Users can optionally clone these when building their schedule.';
COMMENT ON COLUMN "public"."master_courses"."default_credits" IS 'Default credit weight (e.g., 0.5 for half-credit course).';

-- 1B. MASTER ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS "public"."master_assessments" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "master_course_id" UUID NOT NULL REFERENCES "public"."master_courses"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "weight" NUMERIC(5,2) NOT NULL,
    "default_due_offset_days" INTEGER NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE "public"."master_assessments" IS 'Template assessments linked to master courses. Due dates calculated as offset from term start.';
COMMENT ON COLUMN "public"."master_assessments"."default_due_offset_days" IS 'Days offset from term start date (e.g., 20 = 20 days after term begins).';

-- =============================================
-- SECTION 2: ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE "public"."master_courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."master_assessments" ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Master Courses (Public Read, Service Role Write)
CREATE POLICY "Authenticated users can read master courses"
ON "public"."master_courses" FOR SELECT
TO authenticated
USING (true);

-- RLS Policies: Master Assessments (Public Read, Service Role Write)
CREATE POLICY "Authenticated users can read master assessments"
ON "public"."master_assessments" FOR SELECT
TO authenticated
USING (true);

-- Note: Only Service Role can INSERT/UPDATE (enforced by Supabase by default)

-- =============================================
-- SECTION 3: PERFORMANCE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_master_courses_master_term_id ON "public"."master_courses"("master_term_id");
CREATE INDEX IF NOT EXISTS idx_master_assessments_master_course_id ON "public"."master_assessments"("master_course_id");

-- =============================================
-- SECTION 4: SEED SYDE 2B DATA
-- =============================================

DO $$
DECLARE
    -- Variables
    v_program_id UUID;
    v_master_term_id UUID;
    v_term_reference_date DATE := '2026-01-05';
    
    -- Course variables
    v_course_id UUID;
    
    -- SYDE 2B Course & Assessment Data
    v_course_data JSONB := '[
        {
            "course_code": "SYDE 285",
            "course_name": "Material Chemistry",
            "color": "#be185d",
            "assessments": [
                { "name": "Assignment 1", "weight": 1.5, "due_date": "2026-01-25" },
                { "name": "Quiz 1", "weight": 1, "due_date": "2026-01-25" },
                { "name": "Assignment 2", "weight": 1.5, "due_date": "2026-02-08" },
                { "name": "Quiz 2", "weight": 1, "due_date": "2026-02-08" },
                { "name": "Midterm Exam", "weight": 20, "due_date": "2026-02-27" },
                { "name": "Assignment 3", "weight": 1.5, "due_date": "2026-03-08" },
                { "name": "Quiz 3", "weight": 1, "due_date": "2026-03-08" },
                { "name": "Assignment 4", "weight": 1.5, "due_date": "2026-03-15" },
                { "name": "Quiz 4", "weight": 1, "due_date": "2026-03-15" },
                { "name": "Case Studies / Tutorials", "weight": 10, "due_date": "2026-04-05" },
                { "name": "Term Project", "weight": 15, "due_date": "2026-04-08" },
                { "name": "Final Exam", "weight": 45, "due_date": "2026-04-20" }
            ]
        },
        {
            "course_code": "SYDE 283",
            "course_name": "Physics 2: Information Systems",
            "color": "#eab308",
            "assessments": [
                { "name": "Topic Mastery 1", "weight": 2, "due_date": "2026-01-12" },
                { "name": "Topic Mastery 2", "weight": 2, "due_date": "2026-01-19" },
                { "name": "Topic Mastery 3", "weight": 2, "due_date": "2026-01-26" },
                { "name": "Unit Test 1", "weight": 20, "due_date": "2026-02-02" },
                { "name": "Topic Mastery 4", "weight": 2, "due_date": "2026-02-05" },
                { "name": "Topic Mastery 5", "weight": 2, "due_date": "2026-02-09" },
                { "name": "Mini-Project Proposal", "weight": 0, "due_date": "2026-02-13" },
                { "name": "Topic Mastery 6", "weight": 2, "due_date": "2026-02-27" },
                { "name": "Topic Mastery 7", "weight": 2, "due_date": "2026-03-06" },
                { "name": "Unit Test 2", "weight": 20, "due_date": "2026-03-13" },
                { "name": "Topic Mastery 8", "weight": 2, "due_date": "2026-03-16" },
                { "name": "Topic Mastery 9", "weight": 2, "due_date": "2026-03-20" },
                { "name": "Topic Mastery 10", "weight": 2, "due_date": "2026-03-27" },
                { "name": "Mini-Project Final", "weight": 10, "due_date": "2026-04-03" },
                { "name": "Topic Mastery 11", "weight": 2, "due_date": "2026-04-06" },
                { "name": "Unit Test 3 (Final)", "weight": 30, "due_date": "2026-04-10" }
            ]
        },
        {
            "course_code": "SYDE 261",
            "course_name": "Societal Systems Design",
            "color": "#10b981",
            "assessments": [
                { "name": "Reflection 1", "weight": 1, "due_date": "2026-01-09" },
                { "name": "Reflection 2", "weight": 1, "due_date": "2026-01-16" },
                { "name": "Reflection 3", "weight": 1, "due_date": "2026-01-23" },
                { "name": "Reflection 4", "weight": 1, "due_date": "2026-01-30" },
                { "name": "Reflection 5", "weight": 1, "due_date": "2026-02-06" },
                { "name": "W08 Test (Midterm)", "weight": 20, "due_date": "2026-02-24" },
                { "name": "Reflection 6", "weight": 1, "due_date": "2026-03-06" },
                { "name": "Reflection 7", "weight": 1, "due_date": "2026-03-13" },
                { "name": "Reflection 8", "weight": 1, "due_date": "2026-03-20" },
                { "name": "W12 Test (Final)", "weight": 20, "due_date": "2026-03-24" },
                { "name": "Reflection 9", "weight": 1, "due_date": "2026-03-27" },
                { "name": "System Advocacy Project", "weight": 30, "due_date": "2026-04-03" },
                { "name": "Reflection 10", "weight": 1, "due_date": "2026-04-03" },
                { "name": "Participation: Take Note", "weight": 10, "due_date": "2026-04-06" },
                { "name": "Participation: Circle", "weight": 10, "due_date": "2026-04-06" }
            ]
        },
        {
            "course_code": "SYDE 211",
            "course_name": "Advanced Calculus",
            "color": "#06b6d4",
            "assessments": [
                { "name": "Quiz 1", "weight": 6.25, "due_date": "2026-01-22" },
                { "name": "Quiz 2", "weight": 6.25, "due_date": "2026-01-29" },
                { "name": "Quiz 3", "weight": 6.25, "due_date": "2026-02-12" },
                { "name": "Midterm Exam", "weight": 30, "due_date": "2026-03-02" },
                { "name": "Quiz 4", "weight": 6.25, "due_date": "2026-03-12" },
                { "name": "Quiz 5", "weight": 6.25, "due_date": "2026-03-26" },
                { "name": "Final Exam", "weight": 45, "due_date": "2026-04-15" }
            ]
        },
        {
            "course_code": "SYDE 182",
            "course_name": "Dynamics",
            "color": "#8b5cf6",
            "assessments": [
                { "name": "Quiz 1", "weight": 15, "due_date": "2026-01-29" },
                { "name": "Midterm Exam", "weight": 35, "due_date": "2026-02-26" },
                { "name": "Quiz 2", "weight": 15, "due_date": "2026-03-19" },
                { "name": "Final Exam", "weight": 35, "due_date": "2026-04-20" }
            ]
        },
        {
            "course_code": "SYDE 263",
            "course_name": "Design Workshops (Labs)",
            "color": "#f97316",
            "assessments": [
                { "name": "Safety Training", "weight": 0, "due_date": "2026-01-09" },
                { "name": "Lab 1: CAD (Req)", "weight": 10, "due_date": "2026-01-23" },
                { "name": "Lab 2: Reverse Eng (Opt)", "weight": 0, "due_date": "2026-01-30" },
                { "name": "Lab 3: Sensors (Req)", "weight": 10, "due_date": "2026-02-06" },
                { "name": "Intro Fabrication Project", "weight": 10, "due_date": "2026-02-06" },
                { "name": "Final Project Interim 1", "weight": 0, "due_date": "2026-02-13" },
                { "name": "Lab 5: Actuators (Req)", "weight": 10, "due_date": "2026-02-27" },
                { "name": "Lab 6: Embedded (Req)", "weight": 10, "due_date": "2026-03-06" },
                { "name": "Final Project Interim 2", "weight": 0, "due_date": "2026-03-13" },
                { "name": "Lab 7: 3D Printing (Opt)", "weight": 0, "due_date": "2026-03-13" },
                { "name": "Lab 8: Sourcing (Opt)", "weight": 0, "due_date": "2026-03-20" },
                { "name": "Lab Practice & Safety", "weight": 10, "due_date": "2026-04-03" },
                { "name": "Final Project", "weight": 40, "due_date": "2026-04-03" }
            ]
        }
    ]'::JSONB;
    
    v_course JSONB;
    v_assessment JSONB;
    v_offset_days INTEGER;
    
BEGIN
    -- =========================================
    -- STEP 1: LOOKUP PROGRAM ID FOR SYDE
    -- =========================================
    SELECT p.id INTO v_program_id
    FROM "public"."programs" p
    JOIN "public"."universities" u ON p.university_id = u.id
    WHERE u.name = 'University of Waterloo'
    AND p.name = 'Systems Design Engineering';
    
    IF v_program_id IS NULL THEN
        RAISE EXCEPTION 'Systems Design Engineering program not found!';
    END IF;
    
    RAISE NOTICE 'Found SYDE Program ID: %', v_program_id;
    
    -- =========================================
    -- STEP 2: LOOKUP/CREATE MASTER TERM "2B"
    -- =========================================
    SELECT id INTO v_master_term_id
    FROM "public"."master_terms"
    WHERE program_id = v_program_id
    AND label = '2B';
    
    -- If 2B doesn't exist, create it
    IF v_master_term_id IS NULL THEN
        INSERT INTO "public"."master_terms" (program_id, label)
        VALUES (v_program_id, '2B')
        RETURNING id INTO v_master_term_id;
        
        RAISE NOTICE 'Created master term 2B with ID: %', v_master_term_id;
    ELSE
        RAISE NOTICE 'Found existing master term 2B ID: %', v_master_term_id;
    END IF;
    
    -- =========================================
    -- STEP 3: INSERT COURSES & ASSESSMENTS
    -- =========================================
    FOR v_course IN SELECT * FROM jsonb_array_elements(v_course_data)
    LOOP
        -- Insert Course
        INSERT INTO "public"."master_courses" (
            master_term_id,
            code,
            name,
            color,
            default_credits
        ) VALUES (
            v_master_term_id,
            v_course->>'course_code',
            v_course->>'course_name',
            v_course->>'color',
            0.5
        )
        RETURNING id INTO v_course_id;
        
        RAISE NOTICE 'Inserted course: % - %', v_course->>'course_code', v_course->>'course_name';
        
        -- Insert Assessments for this course
        FOR v_assessment IN SELECT * FROM jsonb_array_elements(v_course->'assessments')
        LOOP
            -- Calculate offset days from reference date
            v_offset_days := (v_assessment->>'due_date')::DATE - v_term_reference_date;
            
            INSERT INTO "public"."master_assessments" (
                master_course_id,
                title,
                weight,
                default_due_offset_days
            ) VALUES (
                v_course_id,
                v_assessment->>'name',
                (v_assessment->>'weight')::NUMERIC,
                v_offset_days
            );
        END LOOP;
        
    END LOOP;
    
    RAISE NOTICE 'SYDE 2B Master Library seeding complete!';
    
END $$;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

COMMENT ON SCHEMA public IS 'Phase 2.2: Master Library (SYDE 2B) - Migration completed successfully.';
