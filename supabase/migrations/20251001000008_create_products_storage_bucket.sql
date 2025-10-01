-- Setup RLS policies for products storage bucket
--
-- PREREQUISITE: Create the 'products' bucket manually via Supabase Dashboard:
-- 1. Go to Dashboard > Storage
-- 2. Click "New Bucket"
-- 3. Name: "products"
-- 4. Public: true (checked)
-- 5. File size limit: 5MB
-- 6. Allowed MIME types: image/jpeg, image/png, image/webp
--
-- Or use the Supabase JS API to create it programmatically
-- This migration only sets up the RLS policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access for Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Product Images" ON storage.objects;

-- Allow anyone to view product images (public bucket)
CREATE POLICY "Public Access for Product Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Allow authenticated admin users to upload product images
CREATE POLICY "Admin Upload Product Images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow authenticated admin users to update product images
CREATE POLICY "Admin Update Product Images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow authenticated admin users to delete product images
CREATE POLICY "Admin Delete Product Images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create helper function to cleanup orphaned product images
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_product_images()
RETURNS TABLE(deleted_path TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, storage, pg_catalog
AS $$
DECLARE
  obj RECORD;
  product_exists BOOLEAN;
BEGIN
  -- Only allow service_role to execute
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Only service role can cleanup orphaned images';
  END IF;

  FOR obj IN
    SELECT name, id
    FROM storage.objects
    WHERE bucket_id = 'products'
  LOOP
    -- Extract product ID from path (format: products/{product_id}/...)
    IF obj.name LIKE '%/%' THEN
      -- Check if referenced product exists
      SELECT EXISTS(
        SELECT 1 FROM public.products
        WHERE id::text = split_part(obj.name, '/', 1)
      ) INTO product_exists;

      -- Delete if product doesn't exist
      IF NOT product_exists THEN
        DELETE FROM storage.objects
        WHERE id = obj.id AND bucket_id = 'products';

        deleted_path := obj.name;
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.cleanup_orphaned_product_images() IS
  'Removes product images that no longer have associated products in the database';

GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_product_images() TO service_role;
