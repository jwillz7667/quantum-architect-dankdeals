-- Simplify RLS policies for public access without authentication
-- This migration removes admin-only policies and ensures public access works

-- First, drop all existing admin policies that require auth.users access
DROP POLICY IF EXISTS "Admins can do everything with products" ON products;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Drop and recreate the public access policy to ensure it's the only one
DROP POLICY IF EXISTS "Anyone can view active products" ON products;

-- Create simple public access policies that don't require authentication
CREATE POLICY "Public can view active products" ON products
  FOR SELECT 
  USING (is_active = true);

-- Allow public access to product variants (needed for the products query)
DROP POLICY IF EXISTS "Anyone can view product variants" ON product_variants;
CREATE POLICY "Public can view product variants" ON product_variants
  FOR SELECT 
  USING (true);  -- All variants are public

-- Disable RLS entirely for read-only public tables if needed
-- This ensures no authentication is required for basic product browsing
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;

-- For categories table if it exists
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Comment explaining the change
COMMENT ON TABLE products IS 'Public access table - RLS disabled for guest checkout system';
COMMENT ON TABLE product_variants IS 'Public access table - RLS disabled for guest checkout system';