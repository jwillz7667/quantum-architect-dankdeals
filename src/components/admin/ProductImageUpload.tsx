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
import { validateImageUrl } from '@/lib/validation/image-url-validator';
import { Progress } from '@/components/ui/progress';

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  url?: string;
  error?: string;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

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
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  // Initialize from value
  useEffect(() => {
    if (value) {
      const urls = Array.isArray(value) ? value : [value];
      setUploadedUrls(urls);
    }
  }, [value]);

  /**
   * Upload a single file with retry logic
   */
  const uploadFileWithRetry = async (
    file: File,
    fileId: string,
    attempt: number = 1
  ): Promise<{ url?: string; error?: string }> => {
    try {
      const result = await uploadProductImage(file, productId, variant);
      
      if (result.error && attempt < MAX_RETRY_ATTEMPTS) {
        console.warn(`Upload attempt ${attempt} failed, retrying...`, result.error);
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        
        // Update progress to show retry
        setUploadProgress(prev => 
          prev.map(p => 
            p.fileName === file.name 
              ? { ...p, progress: 10 * attempt, status: 'uploading' as const }
              : p
          )
        );
        
        return uploadFileWithRetry(file, fileId, attempt + 1);
      }
      
      return result;
    } catch (error) {
      if (attempt < MAX_RETRY_ATTEMPTS) {
        console.warn(`Upload attempt ${attempt} threw error, retrying...`, error);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        return uploadFileWithRetry(file, fileId, attempt + 1);
      }
      
      return {
        error: error instanceof Error ? error.message : 'Upload failed after retries',
      };
    }
  };

  // Handle file upload to Supabase
  const handleUpload = useCallback(async (files: Array<{ id: string; file: File }>) => {
    if (!files.length || isUploading) return;

    setIsUploading(true);
    setOverallProgress(0);
    
    const newUrls: string[] = [];
    const errors: string[] = [];

    // Initialize progress tracking
    const initialProgress: UploadProgress[] = files.map(f => ({
      fileName: f.file.name,
      progress: 0,
      status: 'uploading' as const,
    }));
    setUploadProgress(initialProgress);

    try {
      // Get pending uploads from window object (set by ImageUpload component)
      const pendingUploads = (window as any).__pendingImageUploads;

      for (let i = 0; i < files.length; i++) {
        const fileInfo = files[i];
        
        try {
          // Update progress
          pendingUploads?.updateProgress(fileInfo.id, 10);
          setUploadProgress(prev =>
            prev.map(p =>
              p.fileName === fileInfo.file.name
                ? { ...p, progress: 10 }
                : p
            )
          );

          // Require product ID for upload
          if (!productId) {
            const errorMsg = 'Product must be saved before uploading images. Please save the product first, then upload images.';
            errors.push(errorMsg);
            pendingUploads?.markUploadFailed(fileInfo.id, errorMsg);
            
            setUploadProgress(prev =>
              prev.map(p =>
                p.fileName === fileInfo.file.name
                  ? { ...p, status: 'failed' as const, error: errorMsg }
                  : p
              )
            );
            continue;
          }

          // Update progress: optimizing
          setUploadProgress(prev =>
            prev.map(p =>
              p.fileName === fileInfo.file.name
                ? { ...p, progress: 30 }
                : p
            )
          );

          // Upload to Supabase Storage with retry logic
          const result = await uploadFileWithRetry(fileInfo.file, fileInfo.id);

          // Update progress: uploading
          setUploadProgress(prev =>
            prev.map(p =>
              p.fileName === fileInfo.file.name
                ? { ...p, progress: 80 }
                : p
            )
          );

          if (result.error) {
            errors.push(`Failed to upload ${fileInfo.file.name}: ${result.error}`);
            pendingUploads?.markUploadFailed(fileInfo.id, result.error);
            
            setUploadProgress(prev =>
              prev.map(p =>
                p.fileName === fileInfo.file.name
                  ? { ...p, status: 'failed' as const, error: result.error }
                  : p
              )
            );
          } else if (result.url) {
            // Validate the URL before accepting it
            const validation = validateImageUrl(result.url);
            if (!validation.valid) {
              const error = validation.error || 'Invalid URL returned';
              errors.push(`${fileInfo.file.name}: ${error}`);
              pendingUploads?.markUploadFailed(fileInfo.id, error);
              
              setUploadProgress(prev =>
                prev.map(p =>
                  p.fileName === fileInfo.file.name
                    ? { ...p, status: 'failed' as const, error }
                    : p
                )
              );
            } else {
              newUrls.push(result.url);
              pendingUploads?.markUploadComplete(fileInfo.id, result.url);
              console.log(`✅ Upload successful - Supabase URL: ${result.url}`);
              
              setUploadProgress(prev =>
                prev.map(p =>
                  p.fileName === fileInfo.file.name
                    ? { ...p, progress: 100, status: 'completed' as const, url: result.url }
                    : p
                )
              );
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          errors.push(`Failed to upload ${fileInfo.file.name}: ${errorMessage}`);
          pendingUploads?.markUploadFailed(fileInfo.id, errorMessage);
          
          setUploadProgress(prev =>
            prev.map(p =>
              p.fileName === fileInfo.file.name
                ? { ...p, status: 'failed' as const, error: errorMessage }
                : p
            )
          );
        }
        
        // Update overall progress
        setOverallProgress(Math.round(((i + 1) / files.length) * 100));
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

        console.log(`✅ ProductImageUpload: Setting Supabase URLs to form`, {
          variant,
          uploadedCount: newUrls.length,
          finalUrls,
          productId
        });

        setUploadedUrls(finalUrls);

        // CRITICAL: Update parent component with Supabase URLs IMMEDIATELY
        // This ensures the form has the correct URLs before submission
        const urlsToSave = multiple ? finalUrls : (finalUrls[0] || null);
        console.log(`✅ Calling onChange with Supabase URLs:`, urlsToSave);
        onChange(urlsToSave);
        onUploadComplete?.(finalUrls);

        toast.success(`Successfully uploaded ${newUrls.length} image${newUrls.length > 1 ? 's' : ''} to Supabase! URLs ready to save.`, {
          description: 'Click "Save Product" to update the database',
          duration: 5000,
        });
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
      setUploadProgress([]);
      setOverallProgress(0);
      // Clean up window object
      delete (window as any).__pendingImageUploads;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, variant, multiple, onChange, onUploadComplete, onUploadError]);

  // Custom onChange handler that integrates with upload
  const handleChange = useCallback((newValue: string | string[] | null) => {
    console.log('ProductImageUpload.handleChange called', { 
      newValue, 
      isArray: Array.isArray(newValue),
      hasPending: !!(window as any).__pendingImageUploads
    });
    
    // Check if there are new files to upload
    const pendingUploads = (window as any).__pendingImageUploads;

    if (pendingUploads?.files?.length > 0) {
      console.log('ProductImageUpload: Detected pending uploads, triggering Supabase upload', {
        fileCount: pendingUploads.files.length,
        variant,
        productId
      });
      
      // Trigger upload for new files to Supabase
      void handleUpload(pendingUploads.files);
    } else {
      // Handle removal or other changes (no upload needed)
      console.log('ProductImageUpload: No pending uploads, updating state', { newValue });
      onChange(newValue);

      // Update local state
      if (newValue) {
        const urls = Array.isArray(newValue) ? newValue : [newValue];
        setUploadedUrls(urls);
      } else {
        setUploadedUrls([]);
      }
    }
  }, [onChange, handleUpload, variant, productId]);

  return (
    <div className="space-y-4">
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
            ? 'Uploading to Supabase...'
            : `Drag and drop ${multiple ? 'images' : 'an image'} here or click to browse`
        }
      />
      
      {/* Upload Progress Indicator */}
      {isUploading && uploadProgress.length > 0 && (
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Uploading to Supabase Storage...</span>
            <span className="text-sm text-muted-foreground">{overallProgress}%</span>
          </div>
          
          <Progress value={overallProgress} className="h-2" />
          
          {/* Individual file progress */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {uploadProgress.map((item, index) => (
              <div key={index} className="text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="truncate max-w-[200px]">{item.fileName}</span>
                  <span className={
                    item.status === 'completed' ? 'text-green-600' :
                    item.status === 'failed' ? 'text-red-600' :
                    'text-blue-600'
                  }>
                    {item.status === 'completed' ? '✅ Complete' :
                     item.status === 'failed' ? '❌ Failed' :
                     `${item.progress}%`}
                  </span>
                </div>
                {item.status === 'uploading' && (
                  <Progress value={item.progress} className="h-1" />
                )}
                {item.error && (
                  <p className="text-red-600 text-xs">{item.error}</p>
                )}
              </div>
            ))}
          </div>
          
          {uploadProgress.some(p => p.status === 'failed') && (
            <p className="text-xs text-amber-600">
              ⚠️ Some uploads failed. They will be retried automatically (up to 3 attempts).
            </p>
          )}
        </div>
      )}
      
      {/* Success Message */}
      {!isUploading && uploadProgress.length > 0 && uploadProgress.every(p => p.status === 'completed') && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            ✅ All images uploaded successfully to Supabase!
          </p>
          <p className="text-xs text-green-700 mt-1">
            Click "Save Product" below to save the URLs to the database.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductImageUpload;