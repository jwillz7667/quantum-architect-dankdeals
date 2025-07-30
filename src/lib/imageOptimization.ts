/**
 * Modern image optimization utilities following web performance best practices
 */

import { supabase } from '@/integrations/supabase/client';

// Image size configurations for responsive loading
export const IMAGE_SIZES = {
  thumbnail: { width: 128, height: 128 },
  card: { width: 320, height: 320 },
  detail: { width: 800, height: 800 },
  full: { width: 1920, height: 1920 },
} as const;

// Placeholder data URL for immediate rendering (1x1 transparent pixel)
export const PLACEHOLDER_DATA_URL =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Cpath d="M200 150c-27.6 0-50 22.4-50 50s22.4 50 50 50 50-22.4 50-50-22.4-50-50-50zm0 80c-16.5 0-30-13.5-30-30s13.5-30 30-30 30 13.5 30 30-13.5 30-30 30z" fill="%23d1d5db"/%3E%3Cpath d="M300 100H100c-11 0-20 9-20 20v160c0 11 9 20 20 20h200c11 0 20-9 20-20V120c0-11-9-20-20-20zm0 180H100V120h200v160z" fill="%23d1d5db"/%3E%3Cpath d="M150 240l50-60 30 36 20-24 50 60" fill="none" stroke="%23d1d5db" stroke-width="2"/%3E%3C/svg%3E';

// Default fallback image path
export const DEFAULT_FALLBACK = '/assets/placeholder.svg';

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
}

/**
 * Get optimized image URL from Supabase Storage with transformation
 */
export function getSupabaseImageUrl(
  path: string | null | undefined,
  options: ImageTransformOptions = {}
): string {
  if (!path) return DEFAULT_FALLBACK;

  // Handle full URLs (already from Supabase)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    // If it's already a Supabase URL, add transformation parameters
    if (path.includes('supabase.co')) {
      const url = new URL(path);
      if (options.width) url.searchParams.set('width', options.width.toString());
      if (options.height) url.searchParams.set('height', options.height.toString());
      if (options.quality) url.searchParams.set('quality', options.quality.toString());
      if (options.format) url.searchParams.set('format', options.format);
      return url.toString();
    }
    return path;
  }

  // Handle local paths (for development)
  if (path.startsWith('/assets/') || path.startsWith('/')) {
    return path;
  }

  // Handle Supabase storage paths
  const bucketName = 'products'; // Adjust based on your bucket name
  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Generate responsive srcset for optimal loading
 */
export function generateSrcSet(
  imagePath: string,
  sizes: (keyof typeof IMAGE_SIZES)[] = ['thumbnail', 'card', 'detail']
): string {
  return sizes
    .map((size) => {
      const { width } = IMAGE_SIZES[size];
      const url = getSupabaseImageUrl(imagePath, { width, format: 'webp' });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Get sizes attribute for responsive images
 */
export function getImageSizes(variant: 'thumbnail' | 'card' | 'detail' | 'full'): string {
  switch (variant) {
    case 'thumbnail':
      return '(max-width: 640px) 128px, 128px';
    case 'card':
      return '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px';
    case 'detail':
      return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 800px';
    case 'full':
      return '100vw';
    default:
      return '100vw';
  }
}

/**
 * Preload critical images for better LCP
 */
export function preloadImage(src: string, variant: 'card' | 'detail' = 'card'): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.type = 'image/webp';
  link.href = getSupabaseImageUrl(src, {
    width: IMAGE_SIZES[variant].width,
    format: 'webp',
  });
  link.setAttribute('fetchpriority', 'high');
  document.head.appendChild(link);
}

/**
 * Create blur placeholder for progressive loading
 */
export function getBlurPlaceholder(width = 10, height = 10): string {
  // This would ideally be generated server-side from the actual image
  // For now, return a generic blur placeholder
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Cfilter id='b'%3E%3CfeGaussianBlur stdDeviation='2'/%3E%3C/filter%3E%3Crect width='${width}' height='${height}' fill='%23e5e7eb' filter='url(%23b)'/%3E%3C/svg%3E`;
}

/**
 * Check if browser supports modern image formats
 */
export function supportsModernFormats(): { avif: boolean; webp: boolean } {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;

  return {
    avif: canvas.toDataURL('image/avif').startsWith('data:image/avif'),
    webp: canvas.toDataURL('image/webp').startsWith('data:image/webp'),
  };
}
