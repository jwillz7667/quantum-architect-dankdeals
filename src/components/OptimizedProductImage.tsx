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
  variant?: 'thumbnail' | 'card' | 'detail'; // New prop for different sizes
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
  variant = 'card',
}: OptimizedProductImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Try to find smaller image variants for better performance
  const getOptimizedSrc = useCallback((originalSrc: string, targetVariant: string) => {
    // Use actual thumbnail files for better performance
    if (targetVariant === 'thumbnail') {
      // Use 128px thumbnail (e.g., product-1-thumb-128.webp)
      const thumbSrc = originalSrc.replace(/(\.[^.]+)$/, '-thumb-128$1');
      return thumbSrc;
    }

    if (targetVariant === 'card') {
      // Use 160px thumbnail (e.g., product-1-thumb-160.webp)
      const thumbSrc = originalSrc.replace(/(\.[^.]+)$/, '-thumb-160$1');
      return thumbSrc;
    }

    return originalSrc;
  }, []);

  // Generate fallback sources and SEO-compliant srcset
  const finalFallback = fallback || '/assets/placeholder.svg';
  const optimizedSrc = getOptimizedSrc(currentSrc, variant);

  // Generate srcset for better SEO and performance
  const generateSrcSet = useCallback((originalSrc: string) => {
    const baseWithoutExt = originalSrc.replace(/(\.[^.]+)$/, '');
    const ext = originalSrc.match(/(\.[^.]+)$/)?.[1] || '.webp';

    // Create responsive srcset with different sizes
    const srcSet = [
      `${baseWithoutExt}-thumb-128${ext} 128w`,
      `${baseWithoutExt}-thumb-160${ext} 160w`,
      `${originalSrc} 400w`,
    ].join(', ');

    return srcSet;
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    if (!hasError) {
      // First error: try fallback image
      setHasError(true);
      if (fallback && fallback !== currentSrc) {
        setCurrentSrc(fallback);
        return;
      }
    }

    // Final fallback
    setCurrentSrc(finalFallback);
    setIsLoading(false);
    onError?.();
  }, [hasError, fallback, currentSrc, finalFallback, onError]);

  // Apply CSS-based optimization for small variants
  const getImageStyle = () => {
    if (variant === 'thumbnail' || variant === 'card') {
      return {
        imageRendering: 'auto' as const,
        // Use CSS to hint browser about intended display size
        maxWidth: variant === 'thumbnail' ? '128px' : '160px',
        maxHeight: variant === 'thumbnail' ? '128px' : '160px',
      };
    }
    return {};
  };

  return (
    <div className={cn('relative overflow-hidden performance-optimized', className)}>
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
        src={optimizedSrc}
        srcSet={generateSrcSet(src)}
        alt={alt}
        className={cn(
          'w-full h-full transition-opacity duration-300 optimized-image',
          isLoading && 'opacity-0',
          !isLoading && 'opacity-100',
          className
        )}
        style={getImageStyle()}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={handleLoad}
        onError={handleError}
        sizes={sizes}
        // SEO and accessibility attributes
        itemProp="image"
        // Schema.org microdata for better SEO
        itemScope
        itemType="https://schema.org/ImageObject"
      />
    </div>
  );
}

// Note: Shimmer animation styles are already included in global CSS (index.css)
