-- Create RPC function to check if a user is admin
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

-- Also create a simpler version that checks the current user
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN check_user_is_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_current_user_admin() TO authenticated; 