import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedProductImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallback?: string;
}

export function OptimizedProductImage({
  src,
  alt,
  className,
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  onLoad,
  onError,
  fallback,
}: OptimizedProductImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate fallback sources
  const finalFallback = fallback || '/assets/placeholder.svg';

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    // Use final fallback on any error
    setCurrentSrc(finalFallback);
    setIsLoading(false);
    onError?.();
  }, [finalFallback, onError]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Loading skeleton */}
      {isLoading && (
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse',
            'bg-[length:200%_100%] animate-shimmer'
          )}
          aria-hidden="true"
        />
      )}

      {/* Main image element */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={cn(
          'w-full h-full transition-opacity duration-300',
          isLoading && 'opacity-0',
          !isLoading && 'opacity-100',
          className
        )}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        sizes={sizes}
        // SEO and accessibility attributes
        itemProp="image"
      />
    </div>
  );
}

// Note: Shimmer animation styles are already included in global CSS (index.css)
