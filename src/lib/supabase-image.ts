/**
 * Supabase Storage Image Transformation Utilities
 *
 * Supabase Storage supports on-the-fly image transformations
 * using query parameters for width, height, and quality
 */

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'origin' | 'webp' | 'avif';
  resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Generate a transformed image URL with Supabase Storage transformations
 */
export function getTransformedImageUrl(
  originalUrl: string,
  options: ImageTransformOptions
): string {
  if (!originalUrl || !originalUrl.includes('supabase.co')) {
    return originalUrl;
  }

  try {
    const url = new URL(originalUrl);
    const params = new URLSearchParams();

    if (options.width) {
      params.set('width', options.width.toString());
    }
    if (options.height) {
      params.set('height', options.height.toString());
    }
    if (options.quality) {
      params.set('quality', options.quality.toString());
    }
    if (options.format && options.format !== 'origin') {
      params.set('format', options.format);
    }
    if (options.resize) {
      params.set('resize', options.resize);
    }

    // Append transform parameters
    const transformParams = params.toString();
    if (transformParams) {
      url.search = transformParams;
    }

    return url.toString();
  } catch (error) {
    console.error('Error transforming image URL:', error);
    return originalUrl;
  }
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  originalUrl: string,
  widths: readonly number[],
  quality: number = 85
): string {
  if (!originalUrl || !originalUrl.includes('supabase.co')) {
    return '';
  }

  return widths
    .map((width) => {
      const transformedUrl = getTransformedImageUrl(originalUrl, {
        width,
        quality,
        format: 'webp',
        resize: 'cover',
      });
      return `${transformedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * Size configurations for different product image contexts
 */
export const PRODUCT_IMAGE_SIZES = {
  thumbnail: {
    widths: [64, 128],
    sizes: '64px',
    quality: 75,
  },
  card: {
    widths: [160, 240, 320],
    sizes: '(max-width: 640px) 160px, (max-width: 768px) 240px, 320px',
    quality: 80,
  },
  detail: {
    widths: [480, 640, 800],
    sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 640px',
    quality: 85,
  },
  gallery: {
    widths: [640, 800, 1024],
    sizes: '(max-width: 768px) 100vw, 800px',
    quality: 85,
  },
} as const;

/**
 * Get optimized image props for a product image
 */
export function getOptimizedImageProps(
  src: string | null | undefined,
  size: keyof typeof PRODUCT_IMAGE_SIZES = 'card'
) {
  if (!src) {
    return {
      src: '/assets/placeholder.svg',
      srcSet: undefined,
      sizes: undefined,
    };
  }

  const config = PRODUCT_IMAGE_SIZES[size];

  // For mobile-first loading, use smallest appropriate size
  const defaultWidth = size === 'card' ? 160 : config.widths[0];
  const optimizedSrc = getTransformedImageUrl(src, {
    width: defaultWidth,
    quality: config.quality,
    format: 'webp',
    resize: 'cover',
  });

  const srcSet = generateSrcSet(src, config.widths, config.quality);

  return {
    src: optimizedSrc,
    srcSet,
    sizes: config.sizes,
  };
}
