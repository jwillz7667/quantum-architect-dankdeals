-- Fix RLS policies to ensure public access to products
-- The issue: Multiple conflicting policies may be blocking access

-- Drop all existing SELECT policies for products and recreate clean ones
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;

-- Create a single, clear policy for public product access
-- This allows anonymous and authenticated users to view all active products
CREATE POLICY "Public read access to active products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Admin policy for viewing all products (including inactive)
CREATE POLICY "Admins view all products"
ON public.products
FOR SELECT
TO authenticated
USING (public.is_admin_user());

-- Fix product_variants policies
DROP POLICY IF EXISTS "Anyone can view active product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Public can view product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Public can view product variants for active products" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can view all product variants" ON public.product_variants;

-- Simple policy for product variants
CREATE POLICY "Public read access to product variants"
ON public.product_variants
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Admin policy for all variants
CREATE POLICY "Admins view all variants"
ON public.product_variants
FOR SELECT
TO authenticated
USING (public.is_admin_user());

-- Fix profiles policies - allow users to read their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Verify RLS is enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.product_variants TO anon, authenticated;
