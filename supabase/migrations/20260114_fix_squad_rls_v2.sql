-- Drop the existing policy first to avoid the "already exists" error
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."focus_sessions";

-- Now recreate it with the correct permissions
CREATE POLICY "Enable read access for all users"
ON "public"."focus_sessions"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE "public"."focus_sessions" ENABLE ROW LEVEL SECURITY;
