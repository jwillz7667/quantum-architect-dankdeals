-- Fix email_queue RLS policy performance issue
-- Issue: auth.uid() is re-evaluated for each row causing N+1 performance problem
-- Solution: Wrap with SELECT to evaluate once per query
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- Drop existing policy
DROP POLICY IF EXISTS "Service role only access" ON public.email_queue;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Service role only access" ON public.email_queue
  FOR ALL TO public
  USING (
    -- Allow service role full access
    (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    OR
    -- Allow authenticated admins read access
    (
      (SELECT auth.uid()) IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
      )
    )
  )
  WITH CHECK (
    -- Allow service role full access
    (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    OR
    -- Allow authenticated admins write access
    (
      (SELECT auth.uid()) IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
      )
    )
  );

-- Add comment documenting the optimization
COMMENT ON POLICY "Service role only access" ON public.email_queue IS
'Optimized policy using (SELECT auth.uid()) to prevent N+1 query evaluation. Service role has full access, admins have read access.';
