import { forwardRef } from 'react';
import { OptimizedProductImage } from '@/components/OptimizedProductImage';
import { cn } from '@/lib/utils';
import type { PRODUCT_IMAGE_SIZES } from '@/lib/supabase-image';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  size?: keyof typeof PRODUCT_IMAGE_SIZES;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Product image component with modern optimization
 * - Lazy loading with intersection observer
 * - Responsive srcset for all screen sizes
 * - WebP format optimization
 * - Mobile-first loading strategy
 * - Proper aspect ratio handling
 */
export const ProductImage = forwardRef<HTMLImageElement, ProductImageProps>(
  ({ src, alt, className, priority = false, size = 'card', onLoad, onError }, ref) => {
    return (
      <OptimizedProductImage
        ref={ref}
        src={src}
        alt={alt}
        className={className}
        priority={priority}
        size={size}
        onLoad={onLoad}
        onError={onError}
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
        <div className="rounded-lg overflow-hidden">
          <OptimizedProductImage
            src={primaryImage}
            alt={alt}
            size="detail"
            priority={true}
            className="w-full"
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
