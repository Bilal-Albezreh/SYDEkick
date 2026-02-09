-- Fix timezone bug by converting date columns from TIMESTAMPTZ to DATE
-- This prevents timezone-related date shifts (off by one day issues)

-- 1. Convert assessments.due_date from TIMESTAMPTZ to DATE
ALTER TABLE public.assessments 
ALTER COLUMN due_date TYPE DATE USING due_date::DATE;

-- 2. Convert personal_tasks.due_date from TIMESTAMPTZ to DATE  
ALTER TABLE public.personal_tasks
ALTER COLUMN due_date TYPE DATE USING due_date::DATE;

-- Note: DATE type stores only YYYY-MM-DD with no time/timezone component
-- This ensures dates are stored and retrieved consistently without timezone conversions
