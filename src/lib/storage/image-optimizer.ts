/**
 * Image Optimization Service
 *
 * Handles client-side image compression and format conversion before upload
 * to Supabase Storage for optimal performance.
 */

import imageCompression from 'browser-image-compression';

export interface ImageOptimizationOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
  convertToWebP?: boolean;
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxSizeMB: 1, // Maximum file size in MB
  maxWidthOrHeight: 2048, // Maximum dimension
  useWebWorker: true, // Use web worker for better performance
  quality: 0.85, // 85% quality (good balance of quality/size)
  convertToWebP: true, // Convert to WebP for better compression
};

/**
 * Optimize an image file before uploading
 * - Compresses the image
 * - Converts to WebP format (if supported and requested)
 * - Reduces dimensions if too large
 * - Maintains aspect ratio
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Check if it's already a small file (under 100KB) - might not need compression
    if (file.size < 100 * 1024 && !opts.convertToWebP) {
      console.log(
        `File ${file.name} is already small (${(file.size / 1024).toFixed(2)}KB), skipping compression`
      );
      return file;
    }

    console.log(`Optimizing image: ${file.name}`, {
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type,
    });

    // Configure compression options
    const compressionOptions = {
      maxSizeMB: opts.maxSizeMB ?? DEFAULT_OPTIONS.maxSizeMB ?? 1,
      maxWidthOrHeight: opts.maxWidthOrHeight ?? DEFAULT_OPTIONS.maxWidthOrHeight ?? 2048,
      useWebWorker: opts.useWebWorker ?? DEFAULT_OPTIONS.useWebWorker ?? true,
      fileType: opts.convertToWebP ? 'image/webp' : file.type,
      initialQuality: opts.quality ?? DEFAULT_OPTIONS.quality ?? 0.85,
      alwaysKeepResolution: false, // Allow reduction if needed
    };

    // Compress the image
    const compressedFile = await imageCompression(file, compressionOptions);

    // Generate new filename with .webp extension if converted
    let newFilename = file.name;
    if (opts.convertToWebP && !file.name.toLowerCase().endsWith('.webp')) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      newFilename = `${nameWithoutExt}.webp`;
    }

    // Create new File object with correct filename
    const optimizedFile = new File([compressedFile], newFilename, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });

    const compressionRatio = ((1 - optimizedFile.size / file.size) * 100).toFixed(1);
    console.log(`Image optimized: ${file.name}`, {
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      optimizedSize: `${(optimizedFile.size / 1024 / 1024).toFixed(2)}MB`,
      compressionRatio: `${compressionRatio}%`,
      format: optimizedFile.type,
    });

    return optimizedFile;
  } catch (error) {
    console.error('Image optimization failed:', error);
    console.warn('Falling back to original file');

    // If optimization fails, return original file
    // This ensures upload still works even if optimization fails
    return file;
  }
}

/**
 * Optimize multiple images in parallel
 */
export async function optimizeImages(
  files: File[],
  options: ImageOptimizationOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<File[]> {
  const optimizedFiles: File[] = [];
  let completed = 0;

  for (const file of files) {
    try {
      const optimized = await optimizeImage(file, options);
      optimizedFiles.push(optimized);
      completed++;

      if (onProgress) {
        onProgress(completed, files.length);
      }
    } catch (error) {
      console.error(`Failed to optimize ${file.name}:`, error);
      // Add original file if optimization fails
      optimizedFiles.push(file);
      completed++;

      if (onProgress) {
        onProgress(completed, files.length);
      }
    }
  }

  return optimizedFiles;
}

/**
 * Check if an image needs optimization
 */
export function needsOptimization(
  file: File,
  maxSizeMB: number = 1,
  maxDimension: number = 2048
): Promise<boolean> {
  return new Promise((resolve) => {
    // Check file size first
    if (file.size > maxSizeMB * 1024 * 1024) {
      resolve(true);
      return;
    }

    // Check dimensions
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const needsResize = img.width > maxDimension || img.height > maxDimension;
      resolve(needsResize);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };

    img.src = url;
  });
}

/**
 * Get estimated compressed size (rough estimate)
 */
export function estimateCompressedSize(file: File, quality: number = 0.85): number {
  // Rough estimation: WebP typically achieves 25-35% better compression than JPEG
  // and quality setting affects size significantly
  const webpFactor = 0.7; // WebP is ~30% smaller
  const qualityFactor = quality;

  return Math.floor(file.size * webpFactor * qualityFactor);
}

/**
 * Generate a thumbnail from an image file
 */
export async function generateThumbnail(file: File, maxSize: number = 256): Promise<File> {
  return optimizeImage(file, {
    maxSizeMB: 0.1, // 100KB max for thumbnails
    maxWidthOrHeight: maxSize,
    quality: 0.8,
    convertToWebP: true,
    useWebWorker: true,
  });
}

/**
 * Validate image before processing
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'File must be an image',
    };
  }

  // Check file size (10MB max before optimization)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${maxSize / 1024 / 1024}MB`,
    };
  }

  // Check file type
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ];

  if (!supportedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported file type. Supported: JPEG, PNG, WebP, HEIC`,
    };
  }

  return { valid: true };
}
