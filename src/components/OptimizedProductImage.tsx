import { useState, useRef, useEffect, useCallback } from 'react';
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
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [currentSrc, setCurrentSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  // Generate fallback sources
  const jpegFallback = src.replace('.webp', '.jpg');
  const finalFallback = fallback || '/assets/placeholder.svg';

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    if (!hasError) {
      // First error: try JPEG fallback
      setHasError(true);
      setCurrentSrc(jpegFallback);
    } else {
      // Second error: use final fallback
      setCurrentSrc(finalFallback);
      setIsLoading(false);
      onError?.();
    }
  }, [hasError, jpegFallback, finalFallback, onError]);

  // Intersection Observer setup for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [priority, isInView]);

  // Set initial src when component becomes visible
  useEffect(() => {
    if (isInView && !currentSrc) {
      setCurrentSrc(src);
    }
  }, [isInView, src, currentSrc]);

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

      {/* Optimized picture element for better format support */}
      <picture>
        {/* WebP source for modern browsers */}
        {currentSrc.endsWith('.webp') && (
          <source srcSet={currentSrc} type="image/webp" sizes={sizes} />
        )}

        {/* JPEG fallback for older browsers */}
        <source srcSet={jpegFallback} type="image/jpeg" sizes={sizes} />

        {/* Main image element */}
        <img
          ref={imgRef}
          src={currentSrc || (isInView ? src : '')}
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
      </picture>

      {/* Error state indicator */}
      {hasError && currentSrc === finalFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
          Image unavailable
        </div>
      )}
    </div>
  );
}

// Note: Shimmer animation styles are already included in global CSS (index.css)
