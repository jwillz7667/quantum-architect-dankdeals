import { forwardRef } from 'react';
import { AspectRatioImage, ProgressiveImage } from '@/components/ui/image';
import { cn } from '@/lib/utils';
import { getOptimizedImageProps } from '@/lib/supabase-image';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  size?: 'thumbnail' | 'card' | 'detail' | 'gallery';
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Size configurations for future use with image optimization services
// const SIZE_CONFIG = {
//   thumbnail: { width: 64, height: 64, quality: 85 },
//   card: { width: 320, height: 320, quality: 85 },
//   detail: { width: 800, height: 800, quality: 90 },
//   gallery: { width: 1200, height: 1200, quality: 90 },
// } as const;

/**
 * Optimized product image component
 * - Responsive sizing
 * - Supabase integration ready
 * - Progressive loading
 * - Consistent aspect ratios
 */
export const ProductImage = forwardRef<HTMLImageElement, ProductImageProps>(
  ({ src, alt, className, priority = false, size = 'card', onLoad, onError }, ref) => {
    // Get optimized image props with srcset for responsive loading
    const { src: optimizedSrc, srcSet, sizes } = getOptimizedImageProps(src, size);

    return (
      <AspectRatioImage
        ref={ref}
        src={optimizedSrc}
        srcSet={srcSet}
        alt={alt}
        aspectRatio={1}
        objectFit="cover"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        sizes={sizes}
        onLoadingComplete={onLoad}
        onError={onError}
        className={cn(className)}
        // Add structured data for SEO
        itemProp="image"
      />
    );
  }
);

ProductImage.displayName = 'ProductImage';

interface ProductImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

/**
 * Product image gallery with progressive loading
 */
export const ProductImageGallery = forwardRef<HTMLDivElement, ProductImageGalleryProps>(
  ({ images, alt, className }, ref) => {
    const primaryImage = images[0] || '/assets/placeholder.svg';

    return (
      <div ref={ref} className={cn('space-y-4', className)}>
        {/* Main image */}
        <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
          <ProgressiveImage
            src={primaryImage}
            alt={alt}
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
        </div>

        {/* Thumbnail grid */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.slice(0, 4).map((image, index) => (
              <button
                key={index}
                className="aspect-square overflow-hidden rounded-md bg-gray-100 hover:opacity-80 transition-opacity"
                aria-label={`View image ${index + 1}`}
              >
                <ProductImage src={image} alt={`${alt} - Image ${index + 1}`} size="thumbnail" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

ProductImageGallery.displayName = 'ProductImageGallery';
