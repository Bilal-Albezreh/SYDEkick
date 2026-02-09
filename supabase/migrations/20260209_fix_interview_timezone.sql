-- Fix timezone bug for interviews table
-- Convert interview_date from TIMESTAMPTZ to TIMESTAMP (without timezone)
-- This ensures datetime strings are stored as-is without timezone interpretation

-- Check if the interviews table exists and has interview_date column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'interviews'
      AND column_name = 'interview_date'
  ) THEN
    -- Convert from TIMESTAMPTZ to TIMESTAMP (stores datetime without timezone)
    ALTER TABLE public.interviews 
    ALTER COLUMN interview_date TYPE TIMESTAMP USING interview_date::TIMESTAMP;
    
    RAISE NOTICE 'Successfully converted interviews.interview_date to TIMESTAMP';
  ELSE
    RAISE NOTICE 'interviews table or interview_date column does not exist';
  END IF;
END $$;

-- Note: TIMESTAMP (without TZ) stores datetime values as-is
-- When you insert "2026-02-13 19:30:00", it stores exactly that
-- No timezone conversions occur on read or write
