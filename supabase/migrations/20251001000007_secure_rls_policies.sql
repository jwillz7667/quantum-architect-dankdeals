-- CRITICAL FIX: Re-enable RLS with proper anon-friendly policies
-- This fixes the security vulnerability while maintaining public product access

-- Re-enable RLS on products and variants
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Drop all existing product policies to start clean
DROP POLICY IF EXISTS "Public read access to active products" ON public.products;
DROP POLICY IF EXISTS "Admins view all products" ON public.products;
DROP POLICY IF EXISTS "Public read access to product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins view all variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can update product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can delete product variants" ON public.product_variants;

-- ===== PUBLIC READ POLICIES (SELECT) =====
-- Allow everyone (anon + authenticated) to view active products
CREATE POLICY "public_select_products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Allow everyone to view active product variants
CREATE POLICY "public_select_variants"
ON public.product_variants
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- ===== ADMIN POLICIES (ALL OPERATIONS) =====
-- Admins can view ALL products (including inactive)
CREATE POLICY "admin_select_all_products"
ON public.products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can INSERT products
CREATE POLICY "admin_insert_products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can UPDATE products
CREATE POLICY "admin_update_products"
ON public.products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can DELETE products
CREATE POLICY "admin_delete_products"
ON public.products
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ===== ADMIN VARIANT POLICIES =====
-- Admins can view ALL variants
CREATE POLICY "admin_select_all_variants"
ON public.product_variants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can INSERT variants
CREATE POLICY "admin_insert_variants"
ON public.product_variants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can UPDATE variants
CREATE POLICY "admin_update_variants"
ON public.product_variants
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can DELETE variants
CREATE POLICY "admin_delete_variants"
ON public.product_variants
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ===== INDEXES FOR PERFORMANCE =====
-- Index for admin role checks (speeds up policy evaluation)
CREATE INDEX IF NOT EXISTS idx_profiles_admin_role
ON public.profiles(id, role)
WHERE role = 'admin';

-- Index for active products (speeds up public queries)
CREATE INDEX IF NOT EXISTS idx_products_active
ON public.products(is_active, created_at DESC)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_variants_active
ON public.product_variants(is_active, product_id)
WHERE is_active = true;

-- ===== GRANT PERMISSIONS =====
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.product_variants TO anon, authenticated;

-- Only authenticated users can attempt INSERT/UPDATE/DELETE
-- (RLS policies will enforce admin role check)
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;

-- ===== COMMENTS =====
COMMENT ON POLICY "public_select_products" ON public.products IS
  'Allow anonymous and authenticated users to view active products for guest checkout';

COMMENT ON POLICY "admin_select_all_products" ON public.products IS
  'Allow admins to view all products including inactive ones. Checks profiles.role server-side.';

COMMENT ON TABLE public.products IS
  'RLS enabled with separate policies for public read and admin write. Admin role verified via profiles table.';
