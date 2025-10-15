/**
 * ImageUpload Component
 *
 * A comprehensive image upload component with drag-and-drop support,
 * image preview, compression, and progress tracking.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type {
  ImageFile,
  ImageUploadProps,
  ImageValidationError,
  DragState,
  ImageCompressionOptions,
} from '@/types/image-upload';
import { DEFAULT_IMAGE_CONFIG, ACCEPTED_IMAGE_TYPES } from '@/types/image-upload';

const ImageUpload = ({
  value,
  onChange,
  onUploadComplete,
  onUploadError,
  multiple = false,
  maxFiles = DEFAULT_IMAGE_CONFIG.maxFiles,
  maxFileSize = 5, // in MB
  acceptedFormats = ACCEPTED_IMAGE_TYPES,
  disabled = false,
  className,
  placeholder = 'Drag and drop images here or click to browse',
  label,
  helperText,
  showPreview = true,
  compressionOptions = DEFAULT_IMAGE_CONFIG.compressionOptions,
}: ImageUploadProps) => {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragCounter: 0,
  });
  const [validationErrors, setValidationErrors] = useState<ImageValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Initialize images from value prop
  useEffect(() => {
    if (value && imageFiles.length === 0) {
      const urls = Array.isArray(value) ? value : [value];
      const existingImages: ImageFile[] = urls.map((url, index) => ({
        id: `existing-${index}-${Date.now()}`,
        file: new File([], 'existing'),
        preview: url,
        uploadedUrl: url,
      }));
      setImageFiles(existingImages);
    }
  }, [value, imageFiles.length]);

  // Validate file
  const validateFile = useCallback((file: File): ImageValidationError | null => {
    const maxSizeBytes = maxFileSize * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      return {
        type: 'size',
        message: `File "${file.name}" exceeds ${maxFileSize}MB limit`,
        file,
      };
    }

    if (!acceptedFormats.includes(file.type)) {
      return {
        type: 'format',
        message: `File "${file.name}" has unsupported format. Accepted: JPEG, PNG, WebP`,
        file,
      };
    }

    return null;
  }, [maxFileSize, acceptedFormats]);

  // Compress image
  const compressImage = async (
    file: File,
    options: ImageCompressionOptions
  ): Promise<File | Blob> => {
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: options.maxSizeMB || 2,
        maxWidthOrHeight: options.maxWidthOrHeight || 1920,
        useWebWorker: options.useWebWorker !== false,
        initialQuality: options.initialQuality || 0.8,
        alwaysKeepResolution: options.alwaysKeepResolution || false,
      });

      // Convert to WebP if specified
      if (options.fileType === 'image/webp' && file.type !== 'image/webp') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        return new Promise<Blob>((resolve, reject) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Failed to convert to WebP'));
                }
              },
              'image/webp',
              options.initialQuality || 0.8
            );
          };
          img.onerror = reject;
          img.src = URL.createObjectURL(compressedFile);
        });
      }

      return compressedFile;
    } catch (error) {
      console.error('Image compression error:', error);
      return file; // Return original if compression fails
    }
  };

  // Process files for upload
  const processFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    setValidationErrors([]);

    const filesArray = Array.from(files);
    const errors: ImageValidationError[] = [];
    const validFiles: File[] = [];

    // Check file count
    if (!multiple && filesArray.length > 1) {
      errors.push({
        type: 'count',
        message: 'Only one image can be uploaded',
      });
    } else if (imageFiles.length + filesArray.length > maxFiles) {
      errors.push({
        type: 'count',
        message: `Maximum ${maxFiles} images allowed`,
      });
    } else {
      // Validate each file
      for (const file of filesArray) {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
        } else {
          validFiles.push(file);
        }
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsProcessing(false);
      return;
    }

    // Compress and prepare images
    const newImageFiles: ImageFile[] = [];

    for (const file of validFiles) {
      try {
        const compressedFile = await compressImage(file, compressionOptions);
        const preview = URL.createObjectURL(compressedFile);

        newImageFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          file: compressedFile instanceof File ? compressedFile : new File([compressedFile], file.name, { type: compressedFile.type }),
          preview,
          uploadProgress: 0,
        });
      } catch (error) {
        console.error('File processing error:', error);
        errors.push({
          type: 'format',
          message: `Failed to process "${file.name}"`,
          file,
        });
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
    }

    if (newImageFiles.length > 0) {
      let updatedFiles: ImageFile[];
      
      if (multiple) {
        updatedFiles = [...imageFiles, ...newImageFiles];
        setImageFiles(updatedFiles);
      } else {
        // Clean up old preview
        if (imageFiles[0]?.preview && !imageFiles[0].uploadedUrl) {
          URL.revokeObjectURL(imageFiles[0].preview);
        }
        updatedFiles = newImageFiles;
        setImageFiles(updatedFiles);
      }

      // DON'T notify parent with blob preview URLs - only notify after actual upload
      // The parent will be notified via __pendingImageUploads mechanism
      
      console.log('ImageUpload: Files processed, ready for upload', {
        fileCount: newImageFiles.length,
        hasPreview: updatedFiles.every(f => f.preview),
        pendingForUpload: updatedFiles.filter(f => !f.uploadedUrl).length
      });
    }

    setIsProcessing(false);
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void processFiles(e.target.files);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;

    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setDragState({ isDragging: true, dragCounter: dragCounterRef.current });
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;

    if (dragCounterRef.current === 0) {
      setDragState({ isDragging: false, dragCounter: 0 });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setDragState({ isDragging: false, dragCounter: 0 });

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      void processFiles(e.dataTransfer.files);
    }
  };

  // Remove image
  const removeImage = (id: string) => {
    setImageFiles((prev) => {
      const updated = prev.filter((img) => img.id !== id);

      // Clean up preview URL
      const removed = prev.find((img) => img.id === id);
      if (removed?.preview && !removed.uploadedUrl) {
        URL.revokeObjectURL(removed.preview);
      }

      // Update parent value
      const urls = updated
        .filter((img) => img.uploadedUrl)
        .map((img) => img.uploadedUrl!);

      if (multiple) {
        onChange(urls.length > 0 ? urls : null);
      } else {
        onChange(urls[0] || null);
      }

      return updated;
    });
  };

  // Update upload progress
  const updateProgress = (id: string, progress: number) => {
    setImageFiles((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, uploadProgress: progress } : img
      )
    );
  };

  // Mark upload as complete
  const markUploadComplete = (id: string, url: string) => {
    setImageFiles((prev) =>
      prev.map((img) =>
        img.id === id
          ? { ...img, uploadedUrl: url, isUploading: false, uploadProgress: 100 }
          : img
      )
    );

    // Update parent value
    const urls = imageFiles
      .map((img) => (img.id === id ? url : img.uploadedUrl))
      .filter((url): url is string => !!url);

    if (multiple) {
      onChange(urls);
      onUploadComplete?.(urls);
    } else {
      onChange(urls[0] || null);
      onUploadComplete?.(urls);
    }
  };

  // Mark upload as failed
  const markUploadFailed = (id: string, error: string) => {
    setImageFiles((prev) =>
      prev.map((img) =>
        img.id === id
          ? { ...img, error, isUploading: false, uploadProgress: 0 }
          : img
      )
    );

    onUploadError?.(new Error(error));
  };

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      imageFiles.forEach((img) => {
        if (img.preview && !img.uploadedUrl) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [imageFiles]);

  // Expose methods to parent via ref if needed
  useEffect(() => {
    if (imageFiles.some(img => !img.uploadedUrl && !img.isUploading && !img.error)) {
      const imagesToUpload = imageFiles.filter(img => !img.uploadedUrl && !img.error);

      // Store these for parent component to trigger upload
      (window as any).__pendingImageUploads = {
        files: imagesToUpload,
        updateProgress,
        markUploadComplete,
        markUploadFailed,
      };
    }
  }, [imageFiles]);

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      {/* Upload Area */}
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-colors',
          dragState.isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer'
        )}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          multiple={multiple}
          disabled={disabled}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3 p-8">
          {isProcessing ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}

          <div className="text-center">
            <p className="text-sm text-muted-foreground">{placeholder}</p>
            {helperText && (
              <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {multiple ? `Max ${maxFiles} images • ` : ''}
              Max {maxFileSize}MB per file • JPEG, PNG, WebP
            </p>
          </div>

          {!disabled && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="pointer-events-none"
            >
              Choose {multiple ? 'Images' : 'Image'}
            </Button>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="space-y-2">
          {validationErrors.map((error, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Image Previews */}
      {showPreview && imageFiles.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {imageFiles.map((img) => (
            <Card key={img.id} className="relative overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={img.preview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />

                {/* Upload Progress Overlay */}
                {img.isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="w-3/4">
                      <Progress value={img.uploadProgress} className="h-1" />
                      <p className="mt-2 text-center text-xs text-white">
                        {img.uploadProgress}%
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Overlay */}
                {img.error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-destructive/90 p-2">
                    <div className="text-center">
                      <AlertCircle className="mx-auto h-6 w-6 text-white" />
                      <p className="mt-1 text-xs text-white">{img.error}</p>
                    </div>
                  </div>
                )}

                {/* Success Indicator */}
                {img.uploadedUrl && !img.error && (
                  <div className="absolute right-2 top-2 rounded-full bg-green-500 p-1">
                    <ImageIcon className="h-3 w-3 text-white" />
                  </div>
                )}

                {/* Remove Button */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.id);
                    }}
                    className="absolute left-2 top-2 rounded-full bg-black/60 p-1 transition-colors hover:bg-black/80"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;