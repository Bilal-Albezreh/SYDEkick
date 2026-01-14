-- Function: cleanup_old_messages
-- Purpose: Delete messages older than 48 hours.
-- Security: SECURITY DEFINER allows it to run with admin privileges (bypassing RLS), 
-- ensuring even normal users can trigger the cleanup of *all* old messages.

CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM "public"."messages"
  WHERE "created_at" < (now() - interval '48 hours');
END;
$$;
