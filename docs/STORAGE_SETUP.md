# Supabase Storage Setup Guide

This guide explains how to set up and configure Supabase Storage for product image uploads in the DankDeals admin panel.

## Prerequisites

- Access to your Supabase project dashboard
- Admin privileges in your Supabase project
- The project should already have the `profiles` and `products` tables created

## Setup Steps

### 1. Run the Migration Script

1. Open your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `/supabase/migrations/20250101_create_products_storage_bucket.sql`
4. Paste and run the SQL script in the editor
5. Verify that the script executes successfully

### 2. Verify Bucket Creation

1. In your Supabase Dashboard, navigate to **Storage**
2. You should see a new bucket called `products`
3. Click on the bucket to verify its settings:
   - **Public Access**: Enabled (for viewing product images)
   - **File Size Limit**: 5MB
   - **Allowed MIME Types**: image/jpeg, image/png, image/webp

### 3. Configure RLS Policies (if not created by migration)

If the migration didn't create the RLS policies, manually add them:

1. Go to **Storage** > **Policies**
2. Select the `products` bucket
3. Add the following policies:

#### Public Read Access
```sql
-- Policy Name: Public Access for Product Images
-- Allowed operation: SELECT
-- Target roles: anon, authenticated

bucket_id = 'products'
```

#### Admin Upload Access
```sql
-- Policy Name: Admin Upload Product Images
-- Allowed operation: INSERT
-- Target roles: authenticated

bucket_id = 'products'
AND auth.uid() IS NOT NULL
AND EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role = 'admin'
)
```

#### Admin Update Access
```sql
-- Policy Name: Admin Update Product Images
-- Allowed operation: UPDATE
-- Target roles: authenticated

-- USING clause:
bucket_id = 'products'
AND auth.uid() IS NOT NULL
AND EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role = 'admin'
)

-- WITH CHECK clause:
bucket_id = 'products'
AND auth.uid() IS NOT NULL
AND EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role = 'admin'
)
```

#### Admin Delete Access
```sql
-- Policy Name: Admin Delete Product Images
-- Allowed operation: DELETE
-- Target roles: authenticated

bucket_id = 'products'
AND auth.uid() IS NOT NULL
AND EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role = 'admin'
)
```

### 4. Update Profile Roles (if needed)

Ensure your admin users have the correct role:

```sql
-- Update a user to have admin role
UPDATE profiles
SET role = 'admin'
WHERE id = 'YOUR_USER_ID';
```

### 5. Test the Setup

1. Log in to your application as an admin user
2. Navigate to the Admin Product Form
3. Try uploading a test image:
   - The upload should complete successfully
   - The image should be viewable immediately
   - You should be able to delete the image

## Storage Structure

The storage bucket uses the following folder structure:

```
products/
├── {product_id}/
│   ├── main/
│   │   └── image-timestamp-hash.webp
│   └── gallery/
│       ├── image1-timestamp-hash.webp
│       ├── image2-timestamp-hash.webp
│       └── ...
└── temp/
    ├── main/
    │   └── ... (for new products without ID)
    └── gallery/
        └── ... (for new products without ID)
```

## Features

### Image Optimization

- **Automatic Compression**: Images are compressed before upload to reduce storage and bandwidth
- **WebP Conversion**: Images are converted to WebP format for better performance
- **Size Limits**:
  - Maximum file size: 5MB per image
  - Maximum dimensions: 1920px (width or height)
  - Quality: 80% for optimal balance

### Supported Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

### Upload Limits

- **Main Image**: 1 image
- **Gallery Images**: Up to 10 images
- **File Size**: 5MB per image
- **Total Storage**: Depends on your Supabase plan

## Troubleshooting

### Common Issues

#### 1. "Storage bucket 'products' does not exist"

**Solution**: Run the migration script or create the bucket manually through the Supabase Dashboard.

#### 2. "Permission denied" errors when uploading

**Solution**:
- Verify the user has `admin` role in the profiles table
- Check that RLS policies are correctly configured
- Ensure the user is authenticated

#### 3. Images upload but don't display

**Solution**:
- Check that the bucket is set to public
- Verify the image URLs are correctly generated
- Check browser console for CORS errors

#### 4. "File size exceeds limit" error

**Solution**:
- Images larger than 5MB will be rejected
- The compression should handle most cases, but very large images may still exceed the limit
- Consider resizing images before upload

### Clean Up Orphaned Images

To remove images from deleted products, run this function periodically:

```sql
SELECT clean_orphaned_product_images();
```

## Security Considerations

1. **Admin-Only Uploads**: Only users with `admin` role can upload/modify images
2. **Public Viewing**: All product images are publicly viewable (required for e-commerce)
3. **File Type Validation**: Only image files (JPEG, PNG, WebP) are accepted
4. **Size Limits**: Prevents abuse through large file uploads
5. **Unique Filenames**: Prevents naming collisions and overwrites

## Monitoring

Monitor your storage usage in the Supabase Dashboard:

1. Go to **Settings** > **Billing & Usage**
2. Check the **Storage** section for current usage
3. Set up alerts if approaching limits

## Backup Strategy

Consider implementing regular backups:

1. Use Supabase's built-in backup features
2. Periodically export product images to external storage
3. Keep a record of image URLs in your database backups

## API Usage

The implementation uses the Supabase JavaScript client:

```typescript
// Upload
const { data, error } = await supabase.storage
  .from('products')
  .upload(path, file);

// Get public URL
const { data } = supabase.storage
  .from('products')
  .getPublicUrl(path);

// Delete
const { error } = await supabase.storage
  .from('products')
  .remove([path]);
```

## Support

For issues or questions:

1. Check the [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
2. Review the error messages in your browser console
3. Check the Supabase Dashboard logs for detailed error information