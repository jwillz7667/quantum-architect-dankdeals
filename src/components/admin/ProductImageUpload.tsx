/**
 * ProductImageUpload Component
 *
 * A specialized image upload component for product images that integrates
 * with Supabase Storage and handles both main and gallery images.
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import ImageUpload from '@/components/ui/image-upload';
import type { ProductImageUploadProps } from '@/types/image-upload';
import {
  uploadProductImage,
  deleteProductImages,
} from '@/lib/storage/supabase-storage';

const ProductImageUpload = ({
  productId,
  variant = 'main',
  value,
  onChange,
  onUploadComplete,
  onUploadError,
  multiple = false,
  maxFiles = 10,
  maxFileSize = 5,
  disabled = false,
  className,
  label,
  helperText,
  showPreview = true,
  compressionOptions,
}: ProductImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  // Initialize from value
  useEffect(() => {
    if (value) {
      const urls = Array.isArray(value) ? value : [value];
      setUploadedUrls(urls);
    }
  }, [value]);

  // Handle file upload to Supabase
  const handleUpload = useCallback(async (files: Array<{ id: string; file: File }>) => {
    if (!files.length || isUploading) return;

    setIsUploading(true);
    const newUrls: string[] = [];
    const errors: string[] = [];

    try {
      // Get pending uploads from window object (set by ImageUpload component)
      const pendingUploads = (window as any).__pendingImageUploads;

      for (const fileInfo of files) {
        try {
          // Update progress
          pendingUploads?.updateProgress(fileInfo.id, 10);

          // Upload to Supabase Storage
          const result = await uploadProductImage(
            fileInfo.file,
            productId || 'temp',
            variant
          );

          if (result.error) {
            errors.push(`Failed to upload ${fileInfo.file.name}: ${result.error}`);
            pendingUploads?.markUploadFailed(fileInfo.id, result.error);
          } else if (result.url) {
            newUrls.push(result.url);
            pendingUploads?.markUploadComplete(fileInfo.id, result.url);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          errors.push(`Failed to upload ${fileInfo.file.name}: ${errorMessage}`);
          pendingUploads?.markUploadFailed(fileInfo.id, errorMessage);
        }
      }

      // Handle successful uploads
      if (newUrls.length > 0) {
        let finalUrls: string[];

        if (variant === 'main' && !multiple) {
          // For main image, replace the existing one
          if (uploadedUrls.length > 0 && uploadedUrls[0]) {
            await deleteProductImages(uploadedUrls[0], 'products');
          }
          finalUrls = newUrls.slice(0, 1);
        } else {
          // For gallery, append to existing
          finalUrls = [...uploadedUrls, ...newUrls];
        }

        setUploadedUrls(finalUrls);

        // Update parent component
        if (multiple) {
          onChange(finalUrls);
          onUploadComplete?.(finalUrls);
        } else {
          onChange(finalUrls[0] || null);
          onUploadComplete?.(finalUrls);
        }

        toast.success(`Successfully uploaded ${newUrls.length} image${newUrls.length > 1 ? 's' : ''}`);
      }

      // Show errors if any
      if (errors.length > 0) {
        errors.forEach(error => toast.error(error));
        onUploadError?.(new Error(errors.join('\n')));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(errorMessage);
      onUploadError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsUploading(false);
      // Clean up window object
      delete (window as any).__pendingImageUploads;
    }
  }, [productId, variant, multiple, uploadedUrls, onChange, onUploadComplete, onUploadError, isUploading]);

  // Custom onChange handler that integrates with upload
  const handleChange = useCallback((newValue: string | string[] | null) => {
    // Check if there are new files to upload
    const pendingUploads = (window as any).__pendingImageUploads;

    if (pendingUploads?.files?.length > 0) {
      // Trigger upload for new files
      void handleUpload(pendingUploads.files);
    } else {
      // Handle removal or other changes
      onChange(newValue);

      // Update local state
      if (newValue) {
        const urls = Array.isArray(newValue) ? newValue : [newValue];
        setUploadedUrls(urls);
      } else {
        setUploadedUrls([]);
      }
    }
  }, [onChange, handleUpload]);

  return (
    <ImageUpload
      value={value}
      onChange={handleChange}
      multiple={multiple}
      maxFiles={maxFiles}
      maxFileSize={maxFileSize}
      disabled={disabled || isUploading}
      className={className}
      label={label || (variant === 'main' ? 'Product Image' : 'Gallery Images')}
      helperText={
        helperText ||
        (variant === 'main'
          ? 'Upload the main product image that will be shown in listings'
          : 'Upload additional product images for the gallery')
      }
      showPreview={showPreview}
      compressionOptions={compressionOptions}
      placeholder={
        isUploading
          ? 'Uploading images...'
          : `Drag and drop ${multiple ? 'images' : 'an image'} here or click to browse`
      }
    />
  );
};

export default ProductImageUpload;