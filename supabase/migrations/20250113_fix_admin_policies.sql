-- Fix Admin RLS Policies to Avoid Infinite Recursion
-- This migration fixes the circular reference in admin policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can do everything with products" ON products;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Drop the existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view active products" ON products;

-- Create new admin policies that check auth metadata directly
-- This avoids the circular reference to the profiles table

-- Products policy for admins (check auth metadata directly)
CREATE POLICY "Admins can do everything with products" ON products
  FOR ALL
  USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        (auth.users.raw_app_meta_data->>'is_admin')::boolean = true
        OR auth.users.raw_app_meta_data->>'role' = 'admin'
      )
    )
  );

-- Orders policies for admins
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        (auth.users.raw_app_meta_data->>'is_admin')::boolean = true
        OR auth.users.raw_app_meta_data->>'role' = 'admin'
      )
    )
  );

CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        (auth.users.raw_app_meta_data->>'is_admin')::boolean = true
        OR auth.users.raw_app_meta_data->>'role' = 'admin'
      )
    )
  );

-- Profiles policy for admins
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        (auth.users.raw_app_meta_data->>'is_admin')::boolean = true
        OR auth.users.raw_app_meta_data->>'role' = 'admin'
      )
    )
  );

-- Ensure regular users can still access products
-- Drop first to avoid conflicts, then recreate
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true);

-- Add a comment explaining the fix
COMMENT ON POLICY "Admins can do everything with products" ON products IS 
  'Admin policy that checks auth metadata directly to avoid circular reference with profiles table'; 