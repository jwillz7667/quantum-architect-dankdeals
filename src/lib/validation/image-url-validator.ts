/**
 * Image URL Validation Utilities
 * 
 * Comprehensive validation for image URLs to ensure only valid,
 * accessible URLs are saved to the database.
 */

import { z } from 'zod';

/**
 * Check if a URL is a temporary blob URL
 */
export function isBlobUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith('blob:') || url.startsWith('data:');
}

/**
 * Check if a URL is a valid Supabase storage URL
 */
export function isSupabaseStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    // Check if it's a Supabase storage URL
    return (
      urlObj.hostname.includes('supabase.co') &&
      urlObj.pathname.includes('/storage/v1/object/public/')
    );
  } catch {
    return false;
  }
}

/**
 * Check if a URL is a valid HTTP/HTTPS URL
 */
export function isValidHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Check if a URL is accessible (not a local/blob URL)
 */
export function isAccessibleUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  // Reject blob and data URLs
  if (isBlobUrl(url)) return false;
  
  // Reject localhost URLs (won't work in production)
  if (url.includes('localhost') || url.includes('127.0.0.1')) return false;
  
  // Must be valid HTTP/HTTPS
  return isValidHttpUrl(url);
}

/**
 * Validate an image URL for storage in database
 */
export function validateImageUrl(url: string | null | undefined): {
  valid: boolean;
  error?: string;
  warning?: string;
} {
  // Null is valid (no image)
  if (!url) {
    return { valid: true };
  }

  // Check for blob URLs (temporary)
  if (isBlobUrl(url)) {
    return {
      valid: false,
      error: 'Blob URLs are temporary and cannot be saved. Please wait for upload to complete or use a permanent URL.',
    };
  }

  // Check for localhost URLs (won't work in production)
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return {
      valid: false,
      error: 'Localhost URLs will not work in production. Please use a public URL or upload to Supabase.',
    };
  }

  // Check for valid HTTP/HTTPS
  if (!isValidHttpUrl(url)) {
    return {
      valid: false,
      error: 'Invalid URL format. Must be a valid HTTP or HTTPS URL.',
    };
  }

  // Warn if not a Supabase URL (might be external)
  if (!isSupabaseStorageUrl(url)) {
    return {
      valid: true,
      warning: 'External URL detected. Supabase storage is recommended for better performance and reliability.',
    };
  }

  // All checks passed
  return { valid: true };
}

/**
 * Validate multiple image URLs
 */
export function validateImageUrls(urls: (string | null | undefined)[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  urls.forEach((url, index) => {
    const result = validateImageUrl(url);
    
    if (!result.valid && result.error) {
      errors.push(`Image ${index + 1}: ${result.error}`);
    }
    
    if (result.warning) {
      warnings.push(`Image ${index + 1}: ${result.warning}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Zod schema for image URLs (for form validation)
 */
export const imageUrlSchema = z
  .string()
  .nullable()
  .refine(
    (url) => {
      if (!url) return true; // null is valid
      return !isBlobUrl(url);
    },
    {
      message: 'Blob URLs cannot be saved. Please wait for upload to complete.',
    }
  )
  .refine(
    (url) => {
      if (!url) return true;
      return isAccessibleUrl(url);
    },
    {
      message: 'URL must be a valid, accessible HTTP/HTTPS URL.',
    }
  );

/**
 * Zod schema for gallery URLs array
 */
export const galleryUrlsSchema = z
  .array(z.string())
  .refine(
    (urls) => {
      return urls.every(url => !isBlobUrl(url));
    },
    {
      message: 'Gallery contains temporary blob URLs. Please wait for all uploads to complete.',
    }
  )
  .refine(
    (urls) => {
      return urls.every(url => isAccessibleUrl(url));
    },
    {
      message: 'All gallery URLs must be valid, accessible HTTP/HTTPS URLs.',
    }
  );

/**
 * Extract product ID from Supabase storage URL
 * Example: https://xxx.supabase.co/storage/v1/object/public/products/[product-id]/main/image.webp
 */
export function extractProductIdFromStorageUrl(url: string): string | null {
  if (!isSupabaseStorageUrl(url)) return null;
  
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const productsIndex = pathParts.indexOf('products');
    
    if (productsIndex !== -1 && productsIndex + 1 < pathParts.length) {
      return pathParts[productsIndex + 1] || null;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if an image URL belongs to a specific product
 */
export function urlBelongsToProduct(url: string, productId: string): boolean {
  const extractedId = extractProductIdFromStorageUrl(url);
  return extractedId === productId;
}

