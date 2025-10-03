# Product Image Upload Fix - Storage Policy Instructions

## Problem Identified

The product image upload functionality has duplicate and potentially conflicting storage policies on the `products` bucket. This needs to be fixed via the Supabase Dashboard.

## Root Cause

1. **Duplicate Policies**: There are 8 policies on the products bucket (4 duplicates)
2. **Policy Names**: Both old and new naming conventions exist
3. **Performance**: Policies don't use optimized `(SELECT auth.uid())` pattern

## Solution: Manual Policy Cleanup via Dashboard

### Step 1: Access Storage Policies

1. Go to Supabase Dashboard → **Storage**
2. Click on the **products** bucket
3. Click on **Policies** tab

### Step 2: Delete ALL Existing Policies

Delete these policies if they exist:

- ❌ "Admin Delete Product Images"
- ❌ "Admin Update Product Images"
- ❌ "Admin Upload Product Images"
- ❌ "Admins can delete product images"
- ❌ "Admins can update product images"
- ❌ "Admins can upload product images"
- ❌ "Public Access for Product Images"
- ❌ "Public can view product images"

### Step 3: Create New Optimized Policies

#### Policy 1: Public Read Access

```sql
Policy Name: products_select_public
Operation: SELECT
Target Roles: public
USING expression:
bucket_id = 'products'
```

#### Policy 2: Admin Upload (INSERT)

```sql
Policy Name: products_insert_admin
Operation: INSERT
Target Roles: public
WITH CHECK expression:
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
```

#### Policy 3: Admin Update (UPDATE)

```sql
Policy Name: products_update_admin
Operation: UPDATE
Target Roles: public
USING expression:
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
```

#### Policy 4: Admin Delete (DELETE)

```sql
Policy Name: products_delete_admin
Operation: DELETE
Target Roles: public
USING expression:
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
```

---

## Alternative: SQL Editor Method

If you prefer to use the SQL Editor (requires superuser or storage admin role):

```sql
-- Run this in Supabase SQL Editor
BEGIN;

-- Drop all existing policies
DROP POLICY IF EXISTS "Admin Delete Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;

-- Create new optimized policies
CREATE POLICY "products_select_public" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'products');

CREATE POLICY "products_insert_admin" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (
    bucket_id = 'products'
    AND (SELECT auth.uid()) IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
      )
      OR (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    )
  );

CREATE POLICY "products_update_admin" ON storage.objects
  FOR UPDATE TO public
  USING (
    bucket_id = 'products'
    AND (SELECT auth.uid()) IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
      )
      OR (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    )
  );

CREATE POLICY "products_delete_admin" ON storage.objects
  FOR DELETE TO public
  USING (
    bucket_id = 'products'
    AND (SELECT auth.uid()) IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
      )
      OR (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    )
  );

COMMIT;
```

---

## Verification Steps

After applying the policies:

### 1. Verify Policies Are Active

```sql
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'products_%'
ORDER BY policyname;
```

Expected output: 4 policies (select_public, insert_admin, update_admin, delete_admin)

### 2. Test Upload as Admin User

1. Log in to admin panel
2. Navigate to **Products** → **Create New Product**
3. Try to upload a product image
4. Check browser console for any errors
5. Verify image appears in Supabase Storage under `products/` folder

### 3. Verify Admin Role

Check if your user has admin role:

```sql
SELECT
  id,
  email,
  role,
  is_admin
FROM profiles
WHERE id = auth.uid();
```

If your user is NOT an admin, set it:

```sql
UPDATE profiles
SET
  role = 'admin',
  is_admin = true
WHERE id = auth.uid();
```

---

## Troubleshooting

### Issue: "Permission denied" error when uploading

**Solution**: Verify you're logged in as an admin user:

```sql
SELECT * FROM profiles WHERE id = auth.uid();
```

If `role` is not 'admin', update it:

```sql
UPDATE profiles SET role = 'admin', is_admin = true WHERE id = auth.uid();
```

### Issue: "Bucket not found" error

**Solution**: Verify products bucket exists:

```sql
SELECT * FROM storage.buckets WHERE id = 'products';
```

If not found, create it via Dashboard → Storage → New Bucket

### Issue: Policies not working after creation

**Solution**:

1. Check if policies are enabled (toggle them off and on)
2. Log out and log back in to refresh JWT token
3. Clear browser cache

---

## Summary

✅ **What This Fixes:**

- Removes duplicate policies causing conflicts
- Optimizes policies for better performance
- Ensures only admins can upload product images
- Allows public to view product images
- Service role maintains full access

✅ **Expected Outcome:**

- Admin users can upload, update, and delete product images
- Public users can view product images
- Clean, maintainable storage policies
- No more upload errors in admin panel
