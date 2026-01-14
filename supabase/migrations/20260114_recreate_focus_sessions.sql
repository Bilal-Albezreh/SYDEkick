-- ⚠️ DESTRUCTIVE: Drops the existing table
DROP TABLE IF EXISTS "public"."focus_sessions";

-- Create the table with all required columns
CREATE TABLE "public"."focus_sessions" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 25,
    "objective_name" TEXT DEFAULT 'Locked In',
    "linked_assessment_id" TEXT, 
    "is_completed" BOOLEAN DEFAULT FALSE,
    "started_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE "public"."focus_sessions" ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can manage their own sessions (Insert, Update, Delete)
CREATE POLICY "Users can manage own sessions" ON "public"."focus_sessions"
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Squad Visibility (Everyone can READ everyone else's sessions)
CREATE POLICY "Enable read access for all users" ON "public"."focus_sessions"
FOR SELECT TO authenticated
USING (true);
