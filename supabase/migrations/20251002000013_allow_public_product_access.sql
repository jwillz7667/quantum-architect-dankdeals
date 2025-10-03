-- Allow anonymous (non-logged-in) users to view products and variants
-- Issue: Products were only visible to authenticated users
-- Solution: Change SELECT policies from 'authenticated' to 'public' role

-- Fix products table SELECT policy
DROP POLICY IF EXISTS "products_select_combined" ON public.products;

CREATE POLICY "products_select_combined" ON public.products
  FOR SELECT
  TO public  -- Changed from 'authenticated' to 'public'
  USING (
    -- Public users see active products
    is_active = true
    OR
    -- Admins see all products (including inactive)
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

COMMENT ON POLICY "products_select_combined" ON public.products IS
'Allows anonymous and authenticated users to view active products. Admins can view all products including inactive ones.';

-- Fix product_variants table SELECT policy
DROP POLICY IF EXISTS "product_variants_select_combined" ON public.product_variants;

CREATE POLICY "product_variants_select_combined" ON public.product_variants
  FOR SELECT
  TO public  -- Changed from 'authenticated' to 'public'
  USING (
    -- Public users see active variants
    is_active = true
    OR
    -- Admins see all variants (including inactive)
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

COMMENT ON POLICY "product_variants_select_combined" ON public.product_variants IS
'Allows anonymous and authenticated users to view active product variants. Admins can view all variants including inactive ones.';

-- Also fix categories table for consistency
DROP POLICY IF EXISTS "categories_select" ON public.categories;

CREATE POLICY "categories_select" ON public.categories
  FOR SELECT
  TO public  -- Ensure categories are also visible to anonymous users
  USING (
    -- Public users see active categories
    is_active = true
    OR
    -- Admins see all categories
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

COMMENT ON POLICY "categories_select" ON public.categories IS
'Allows anonymous and authenticated users to view active categories. Admins can view all categories including inactive ones.';
