-- Fix product image upload by cleaning up and optimizing storage policies
-- Issue: Duplicate policies and missing optimizations causing upload failures

-- Step 1: Drop all existing duplicate product storage policies
DROP POLICY IF EXISTS "Admin Delete Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;

-- Step 2: Create clean, optimized policies for products bucket

-- Allow public to view product images
CREATE POLICY "products_select_public" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'products');

COMMENT ON POLICY "products_select_public" ON storage.objects IS
'Allows anyone to view product images from the products bucket';

-- Allow admins to upload product images
CREATE POLICY "products_insert_admin" ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'products'
    AND (SELECT auth.uid()) IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
      )
      OR
      (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    )
  );

COMMENT ON POLICY "products_insert_admin" ON storage.objects IS
'Allows authenticated admin users and service role to upload product images';

-- Allow admins to update product images
CREATE POLICY "products_update_admin" ON storage.objects
  FOR UPDATE
  TO public
  USING (
    bucket_id = 'products'
    AND (SELECT auth.uid()) IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
      )
      OR
      (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    )
  );

COMMENT ON POLICY "products_update_admin" ON storage.objects IS
'Allows authenticated admin users and service role to update product images';

-- Allow admins to delete product images
CREATE POLICY "products_delete_admin" ON storage.objects
  FOR DELETE
  TO public
  USING (
    bucket_id = 'products'
    AND (SELECT auth.uid()) IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
      )
      OR
      (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    )
  );

COMMENT ON POLICY "products_delete_admin" ON storage.objects IS
'Allows authenticated admin users and service role to delete product images';
