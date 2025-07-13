-- Sync existing auth users to profiles table
-- Run this in Supabase SQL Editor

-- First check if is_admin column exists, if not add it
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create a function to handle new user signups (fixed version)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert existing auth users into profiles table
INSERT INTO public.profiles (id, email, created_at, updated_at, is_admin)
SELECT 
  id,
  email,
  created_at,
  updated_at,
  false as is_admin
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Set admin privileges for your email (UPDATE THIS EMAIL!)
UPDATE profiles SET is_admin = true WHERE email = 'jwillz7667@gmail.com';

-- Check the results
SELECT id, email, first_name, last_name, is_admin, created_at FROM profiles; 