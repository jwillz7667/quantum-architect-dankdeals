-- Fix infinite recursion in profiles RLS policies
-- Run this in Supabase SQL Editor

-- First, drop the problematic policy that's causing recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create a fixed policy that doesn't cause recursion
-- Users can view their own profile (including is_admin field)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Separate policy for admins to view all profiles (without recursion)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.is_admin = true
      AND p.id != profiles.id  -- Prevent recursion by excluding self-reference
    )
  );

-- Also fix the products and orders policies to prevent similar issues
DROP POLICY IF EXISTS "Admins can do everything with products" ON products;
CREATE POLICY "Admins can do everything with products" ON products
  FOR ALL USING (
    is_active = true OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'products', 'orders')
ORDER BY tablename, policyname; 