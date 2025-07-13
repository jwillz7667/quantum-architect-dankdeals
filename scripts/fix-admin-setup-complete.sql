-- Comprehensive Admin Setup Fix
-- Run this script in Supabase SQL editor to properly set up admin access

-- 1. First, create the RPC function if it doesn't exist
CREATE OR REPLACE FUNCTION check_user_is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user has is_admin set to true in raw_app_meta_data
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = user_id 
    AND (
      (raw_app_meta_data->>'is_admin')::boolean = true
      OR raw_app_meta_data->>'role' = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_user_is_admin(UUID) TO authenticated;

-- 2. Create a simpler version that checks the current user
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN check_user_is_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated;

-- 3. Update the admin user's metadata
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{is_admin}',
  'true'::jsonb
)
WHERE email = 'admin@dankdealsmn.com';

-- 4. Verify the update
SELECT 
  id,
  email,
  raw_app_meta_data,
  (raw_app_meta_data->>'is_admin')::boolean as is_admin,
  check_user_is_admin(id) as is_admin_via_function
FROM auth.users
WHERE email = 'admin@dankdealsmn.com';

-- 5. Test the RPC function for the current user (if logged in)
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_email,
  is_current_user_admin() as is_admin; 