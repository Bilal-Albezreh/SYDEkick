-- Create schedule_items table for user weekly schedules
CREATE TABLE IF NOT EXISTS public.schedule_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    day TEXT NOT NULL CHECK (day IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location TEXT,
    type TEXT NOT NULL CHECK (type IN ('LEC', 'TUT', 'LAB', 'SEM')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_schedule_items_user ON schedule_items(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_course ON schedule_items(course_id);
CREATE INDEX IF NOT EXISTS idx_schedule_items_day ON schedule_items(user_id, day);

-- Enable RLS
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/manage their own schedule items
CREATE POLICY "Users can view their own schedule items"
    ON public.schedule_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedule items"
    ON public.schedule_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule items"
    ON public.schedule_items FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule items"
    ON public.schedule_items FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_schedule_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_schedule_items_updated_at
    BEFORE UPDATE ON schedule_items
    FOR EACH ROW
    EXECUTE FUNCTION update_schedule_items_updated_at();
