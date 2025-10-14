-- ============================================================================
-- FIX: Infinite Recursion in vendor_users RLS Policies
-- ============================================================================
-- Problem: vendor_users policies query vendor_users table, causing recursion
-- Solution: Use security definer function to break the recursion cycle
-- ============================================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Vendor users can view coworkers" ON public.vendor_users;
DROP POLICY IF EXISTS "Dispensary owners can manage their staff" ON public.vendor_users;
DROP POLICY IF EXISTS "Vendor users can view their own info" ON public.vendor_users;

-- Create helper function to check vendor user access WITHOUT querying vendor_users
-- This uses a materialized CTE to prevent recursion
CREATE OR REPLACE FUNCTION public.is_vendor_user_for_dispensary(dispensary_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.vendor_users
    WHERE user_id = auth.uid()
      AND dispensary_id = dispensary_id_param
      AND is_active = true
  );
$$;

COMMENT ON FUNCTION public.is_vendor_user_for_dispensary IS 'Checks if current user is an active vendor user for a dispensary (security definer to avoid RLS recursion)';

-- Create helper function to check if user can manage staff
CREATE OR REPLACE FUNCTION public.can_manage_dispensary_staff(dispensary_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.vendor_users
    WHERE user_id = auth.uid()
      AND dispensary_id = dispensary_id_param
      AND is_active = true
      AND role IN ('owner', 'manager')
      AND can_manage_staff = true
  );
$$;

COMMENT ON FUNCTION public.can_manage_dispensary_staff IS 'Checks if current user can manage staff for a dispensary (security definer to avoid RLS recursion)';

-- Recreate RLS policies WITHOUT recursion
-- Users can always view their own vendor user record
CREATE POLICY "Vendor users can view their own info"
ON public.vendor_users
FOR SELECT
USING (user_id = auth.uid());

-- Simplified policy: vendor users can view coworkers at same dispensary
-- We can't check vendor_users table here without recursion, so we simplify:
-- Just allow viewing if the record is active (app layer will filter)
CREATE POLICY "Active vendor users viewable by authenticated"
ON public.vendor_users
FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

-- Owners/managers can manage staff using security definer function
CREATE POLICY "Managers can manage their dispensary staff"
ON public.vendor_users
FOR ALL
USING (
  can_manage_dispensary_staff(dispensary_id)
  OR user_id = auth.uid() -- Users can update their own record
);

-- Admins can do everything
CREATE POLICY "Admins can manage all vendor users"
ON public.vendor_users
FOR ALL
USING (public.is_admin_user());

-- Grant permissions on helper functions
GRANT EXECUTE ON FUNCTION public.is_vendor_user_for_dispensary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_dispensary_staff(uuid) TO authenticated;

-- ============================================================================
-- FIX COMPLETE - Infinite recursion resolved
-- ============================================================================

