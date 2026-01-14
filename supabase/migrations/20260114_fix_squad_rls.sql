-- Policy: Allow authenticated users to view ALL focus sessions (Read-Only)
-- This allows the Squad Widget to see what your friends are doing.

CREATE POLICY "Enable read access for all users"
ON "public"."focus_sessions"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

-- Ensure RLS is actually on (it likely is, but good practice)
ALTER TABLE "public"."focus_sessions" ENABLE ROW LEVEL SECURITY;
