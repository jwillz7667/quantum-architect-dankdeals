-- Test current user's admin status
-- Run this in Supabase SQL editor while logged in as the user

-- Check if the current user has admin status
SELECT 
  id,
  email,
  raw_app_meta_data,
  COALESCE((raw_app_meta_data->>'is_admin')::boolean, false) as is_admin,
  created_at,
  updated_at
FROM auth.users
WHERE id = auth.uid();

-- Check if user exists in profiles table
SELECT 
  id,
  email,
  created_at,
  updated_at
FROM profiles
WHERE id = auth.uid();

-- Check what roles/permissions the current user has
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_user_email,
  auth.role() as current_role; 