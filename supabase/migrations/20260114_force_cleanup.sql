-- 1. Define the cleanup function (SAFE & PRIVILEGED)
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM "public"."messages"
  WHERE "created_at" < (now() - interval '48 hours');
END;
$$;

-- 2. Grant permissions so ANY logged-in user can trigger it via the app
GRANT EXECUTE ON FUNCTION cleanup_old_messages TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_messages TO service_role;

-- 3. FORCE RUN NOW to clear the backlog immediately
SELECT cleanup_old_messages();
