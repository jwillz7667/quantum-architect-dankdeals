-- Fix critical security vulnerability in email_queue table RLS policies
-- The current policies allow public access with "true" expressions
-- This needs to be restricted to service role only

-- Drop the existing overly permissive policies
DROP POLICY IF EXISTS "Service role access" ON public.email_queue;
DROP POLICY IF EXISTS "Service role can manage email queue" ON public.email_queue;

-- Create proper service-role-only policies
-- Note: In Supabase, service role bypasses RLS, but we can also check for specific roles
-- This policy ensures only service operations can access the email queue
CREATE POLICY "Service role only access" 
ON public.email_queue 
FOR ALL 
USING (
  -- Only allow access if the request is made with service role key
  -- or if the user is an admin (for monitoring purposes)
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  OR 
  (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
)
WITH CHECK (
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  OR 
  (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
);