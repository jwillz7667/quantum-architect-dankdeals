-- Test admin access for your user
-- Run this in Supabase SQL Editor

-- Check if your user exists in profiles and has admin access
SELECT 
  id,
  email,
  is_admin,
  created_at
FROM profiles
WHERE email = 'jwillz7667@gmail.com';

-- If no results, your user isn't in profiles table yet
-- If is_admin is NULL or false, run:
-- UPDATE profiles SET is_admin = true WHERE email = 'jwillz7667@gmail.com'; 