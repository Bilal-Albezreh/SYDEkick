-- Add course_id to personal_tasks if missing (nullable FK to courses)
-- Safe to run even if column already exists (e.g. from 20260114_create_personal_tasks)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'personal_tasks'
      AND column_name = 'course_id'
  ) THEN
    ALTER TABLE public.personal_tasks
    ADD COLUMN course_id UUID NULL
    REFERENCES public.courses(id) ON DELETE SET NULL;
  END IF;
END $$;
