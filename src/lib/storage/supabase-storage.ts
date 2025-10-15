/**
 * Supabase Storage Service
 *
 * Handles all interactions with Supabase Storage including
 * uploading, deleting, and generating public URLs for images.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  StorageUploadOptions,
  StorageDeleteOptions,
  UploadResult,
} from '@/types/image-upload';

/**
 * Generate a unique filename to prevent collisions
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanName = originalName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars
    .substring(0, 50); // Limit length

  return `${cleanName}-${timestamp}-${random}.${extension}`;
}

/**
 * Get the public URL for a storage object
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadToStorage({
  bucket,
  path,
  file,
  upsert = false,
  contentType,
}: StorageUploadOptions): Promise<UploadResult> {
  try {
    console.log('uploadToStorage: Starting upload to Supabase', {
      bucket,
      path,
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(2)}KB`,
      contentType: contentType || file.type,
    });

    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert,
      contentType: contentType || file.type,
    });

    if (error) {
      console.error('Storage upload error:', error);
      return {
        error: error.message || 'Failed to upload file',
      };
    }

    if (!data?.path) {
      console.error('Storage upload: No path returned', { data });
      return {
        error: 'Upload succeeded but no path returned',
      };
    }

    const publicUrl = getPublicUrl(bucket, data.path);

    console.log('uploadToStorage: Upload successful', {
      storagePath: data.path,
      publicUrl,
      bucket,
    });

    return {
      url: publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Storage upload exception:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
}

/**
 * Delete files from Supabase Storage
 */
export async function deleteFromStorage({
  bucket,
  paths,
}: StorageDeleteOptions): Promise<{ error?: string }> {
  try {
    if (!paths.length) {
      return {};
    }

    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      console.error('Storage delete error:', error);
      return {
        error: error.message || 'Failed to delete files',
      };
    }

    return {};
  } catch (error) {
    console.error('Storage delete exception:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to delete files',
    };
  }
}

/**
 * Extract the storage path from a public URL
 */
export function extractStoragePath(publicUrl: string, bucket: string): string | null {
  try {
    const url = new URL(publicUrl);
    const pathMatch = url.pathname.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)`));
    return pathMatch?.[1] || null;
  } catch {
    return null;
  }
}

/**
 * Check if a storage bucket exists and create it if not
 * Note: This requires admin privileges and should be run via migration
 */
export async function ensureBucketExists(bucketName: string): Promise<{ error?: string }> {
  try {
    // Try to list files in the bucket - if it doesn't exist, we'll get an error
    const { error: listError } = await supabase.storage.from(bucketName).list('', { limit: 1 });

    if (listError?.message?.includes('not found')) {
      // Bucket doesn't exist - this would need admin API to create
      // Return an error indicating the bucket needs to be created via dashboard or migration
      return {
        error: `Storage bucket '${bucketName}' does not exist. Please create it via Supabase dashboard or migration.`,
      };
    }

    if (listError) {
      return { error: listError.message };
    }

    return {};
  } catch (error) {
    console.error('Bucket check error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to check bucket',
    };
  }
}

/**
 * Batch upload multiple files
 */
export async function batchUpload(
  files: File[],
  bucket: string,
  pathPrefix: string,
  onProgress?: (completed: number, total: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  let completed = 0;

  for (const file of files) {
    const filename = generateUniqueFilename(file.name);
    const path = `${pathPrefix}/${filename}`;

    const result = await uploadToStorage({
      bucket,
      path,
      file,
      upsert: false,
    });

    results.push(result);
    completed++;

    if (onProgress) {
      onProgress(completed, files.length);
    }
  }

  return results;
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  maxSizeBytes: number,
  acceptedFormats: string[]
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSizeBytes) {
    const maxSizeMB = maxSizeBytes / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check file type
  if (!acceptedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported. Accepted formats: ${acceptedFormats.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Product-specific upload helper with automatic image optimization
 */
export async function uploadProductImage(
  file: File,
  productId: string,
  variant: 'main' | 'gallery' = 'main'
): Promise<UploadResult> {
  const bucket = 'products';

  try {
    console.log('uploadProductImage: Starting', {
      fileName: file.name,
      productId,
      variant,
      bucket,
    });

    // Import image optimizer dynamically
    const { optimizeImage, validateImageFile } = await import('./image-optimizer');

    // Validate image
    const validation = validateImageFile(file);
    if (!validation.valid) {
      console.error('uploadProductImage: Validation failed', validation.error);
      return {
        error: validation.error || 'Invalid image file',
      };
    }

    // Optimize image before upload (compress + convert to WebP)
    console.log('uploadProductImage: Optimizing image...');
    const optimizedFile = await optimizeImage(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: variant === 'main' ? 1200 : 2048,
      quality: variant === 'main' ? 0.85 : 0.8,
      convertToWebP: true,
      useWebWorker: true,
    });

    // Generate filename (will have .webp extension after optimization)
    const filename = generateUniqueFilename(optimizedFile.name);
    const path = productId ? `${productId}/${variant}/${filename}` : `temp/${variant}/${filename}`;

    console.log('uploadProductImage: Uploading to Supabase storage', {
      bucket,
      path,
      optimizedSize: `${(optimizedFile.size / 1024).toFixed(2)}KB`,
    });

    const result = await uploadToStorage({
      bucket,
      path,
      file: optimizedFile,
      upsert: false,
    });

    if (result.error) {
      console.error('uploadProductImage: Upload failed', result.error);
    } else {
      console.log('uploadProductImage: Success! Image uploaded to Supabase', result);
    }

    return result;
  } catch (error) {
    console.error('Error in uploadProductImage:', error);
    return {
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete old product images when replacing
 */
export async function deleteProductImages(
  imageUrls: string | string[] | null,
  bucket: string = 'products'
): Promise<{ error?: string }> {
  if (!imageUrls) {
    return {};
  }

  const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
  const paths = urls
    .map((url) => extractStoragePath(url, bucket))
    .filter((path): path is string => path !== null);

  if (paths.length === 0) {
    return {};
  }

  return deleteFromStorage({ bucket, paths });
}
