import { useState, useEffect, useRef, memo } from 'react';
import { cn } from '@/lib/utils';
import {
  getSupabaseImageUrl,
  generateSrcSet,
  getImageSizes,
  PLACEHOLDER_DATA_URL,
  DEFAULT_FALLBACK,
  IMAGE_SIZES,
} from '@/lib/imageOptimization';

interface PerformanceOptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  variant?: keyof typeof IMAGE_SIZES;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  fallback?: string;
  aspectRatio?: string; // e.g., "1/1", "16/9", "4/3"
}

/**
 * Performance-optimized image component following modern web best practices:
 * - Lazy loading with native browser API
 * - Responsive images with srcset
 * - WebP format with fallbacks
 * - Blur-up placeholder technique
 * - Aspect ratio reservation to prevent layout shift
 * - Intersection Observer for visibility detection
 */
export const PerformanceOptimizedImage = memo(function PerformanceOptimizedImage({
  src,
  alt,
  className,
  variant = 'card',
  priority = false,
  onLoad,
  onError,
  fallback = DEFAULT_FALLBACK,
  aspectRatio = '1/1',
}: PerformanceOptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Setup Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !containerRef.current) {
      setIsInView(true);
      return;
    }

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
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [priority]);

  // Update source when in view
  useEffect(() => {
    if (isInView && src) {
      const optimizedUrl = getSupabaseImageUrl(src, {
        width: IMAGE_SIZES[variant].width,
        height: IMAGE_SIZES[variant].height,
        format: 'webp',
        quality: 85,
      });
      setCurrentSrc(optimizedUrl);
    }
  }, [isInView, src, variant]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    if (!hasError && fallback) {
      setHasError(true);
      setCurrentSrc(fallback);
    } else {
      setCurrentSrc(DEFAULT_FALLBACK);
    }
    onError?.();
  };

  // Generate responsive attributes
  const srcSet = src && isInView ? generateSrcSet(src, ['thumbnail', 'card', 'detail']) : undefined;
  const sizes = getImageSizes(variant);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden bg-gray-100', `aspect-[${aspectRatio}]`, className)}
      style={{ aspectRatio }}
    >
      {/* Blur placeholder for smooth loading */}
      {!isLoaded && (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 to-gray-300"
          aria-hidden="true"
        />
      )}

      {/* Low-quality placeholder */}
      {isInView && !isLoaded && (
        <img
          src={PLACEHOLDER_DATA_URL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      {isInView && (
        <img
          ref={imgRef}
          src={currentSrc || fallback}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          // Accessibility and SEO
          itemProp="image"
          role="img"
        />
      )}

      {/* Loading state for screen readers */}
      {!isLoaded && (
        <span className="sr-only" role="status" aria-live="polite">
          Loading image: {alt}
        </span>
      )}
    </div>
  );
});

// Named export for tree-shaking
export default PerformanceOptimizedImage;
