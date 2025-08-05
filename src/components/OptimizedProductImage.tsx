import { useState, useCallback, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { getOptimizedImageProps } from '@/lib/supabase-image';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import type { PRODUCT_IMAGE_SIZES } from '@/lib/supabase-image';

interface OptimizedProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  size?: keyof typeof PRODUCT_IMAGE_SIZES;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Highly optimized product image component following industry best practices:
 * - Lazy loading with intersection observer (except priority images)
 * - Responsive srcset for different screen sizes
 * - WebP format with fallback
 * - Progressive loading with blur-up effect
 * - Proper sizing to prevent layout shift
 * - Native browser optimizations
 */
export const OptimizedProductImage = forwardRef<HTMLImageElement, OptimizedProductImageProps>(
  ({ src, alt, className, priority = false, size = 'card', onLoad, onError }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const { elementRef, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
      threshold: 0.1,
      rootMargin: '100px',
      triggerOnce: true,
    });

    // Get optimized image props
    const { src: optimizedSrc, srcSet, sizes } = getOptimizedImageProps(src, size);

    // Determine if image should load
    const shouldLoad = priority || isIntersecting;

    const handleLoad = useCallback(() => {
      setIsLoaded(true);
      onLoad?.();
    }, [onLoad]);

    const handleError = useCallback(() => {
      setHasError(true);
      onError?.(new Error(`Failed to load image: ${src}`));
    }, [src, onError]);

    return (
      <div
        ref={elementRef}
        className={cn(
          'relative overflow-hidden bg-gray-100',
          'aspect-square', // Maintain 1:1 aspect ratio
          className
        )}
      >
        {/* Placeholder/Loading state */}
        {(!shouldLoad || !isLoaded) && !hasError && (
          <div className="absolute inset-0 animate-pulse bg-gray-200" />
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Actual image */}
        {shouldLoad && !hasError && (
          <img
            ref={ref}
            src={optimizedSrc}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            className={cn(
              'absolute inset-0 w-full h-full object-cover',
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={handleLoad}
            onError={handleError}
            // Prevent right-click save for product images
            onContextMenu={(e) => e.preventDefault()}
            // SEO and accessibility
            itemProp="image"
          />
        )}
      </div>
    );
  }
);

OptimizedProductImage.displayName = 'OptimizedProductImage';
