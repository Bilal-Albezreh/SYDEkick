-- Add missing columns to personal_tasks table
-- This migration adds columns that the app code expects but are missing from the squads_v2 schema

-- Add is_completed column (boolean, defaults to false)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'personal_tasks'
      AND column_name = 'is_completed'
  ) THEN
    ALTER TABLE public.personal_tasks
    ADD COLUMN is_completed BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add type column (text, defaults to 'personal', must be 'personal' or 'course_work')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'personal_tasks'
      AND column_name = 'type'
  ) THEN
    ALTER TABLE public.personal_tasks
    ADD COLUMN type TEXT NOT NULL DEFAULT 'personal'
    CHECK (type IN ('personal', 'course_work'));
  END IF;
END $$;

-- Add course_id column (nullable FK to courses)
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

-- Add created_at timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'personal_tasks'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.personal_tasks
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;
