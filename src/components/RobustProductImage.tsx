import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface RobustProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  aspectRatio?: string;
}

const FALLBACK_IMAGE = '/assets/placeholder.svg';
const LOADING_DELAY = 50; // Small delay to prevent flashing on fast connections

/**
 * Robust image component with industry best practices:
 * - Progressive enhancement with fallbacks
 * - Native lazy loading with Intersection Observer fallback
 * - Error recovery with multiple fallback strategies
 * - Optimized for Core Web Vitals (CLS, LCP)
 * - Production-ready error handling
 */
export const RobustProductImage = memo(function RobustProductImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  onLoad,
  onError,
  aspectRatio = '1/1',
}: RobustProductImageProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [isVisible, setIsVisible] = useState(priority);
  const [displaySrc, setDisplaySrc] = useState<string>('');
  const imageRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();

  // Normalize image source
  const normalizeImageSrc = useCallback((imageSrc: string | null | undefined): string => {
    if (!imageSrc) return FALLBACK_IMAGE;

    // Handle various URL formats
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      return imageSrc;
    }

    // Handle relative paths
    if (imageSrc.startsWith('/')) {
      return imageSrc;
    }

    // Handle Supabase storage URLs
    if (imageSrc.includes('supabase')) {
      return imageSrc;
    }

    // Default: treat as relative path
    return `/${imageSrc}`;
  }, []);

  // Set up Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isVisible) return;

    const currentImageRef = imageRef.current;
    if (!currentImageRef) return;

    // Use native loading="lazy" if supported
    if ('loading' in HTMLImageElement.prototype && !priority) {
      setIsVisible(true);
      return;
    }

    // Fallback to Intersection Observer
    try {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry?.isIntersecting) {
            setIsVisible(true);
            observerRef.current?.disconnect();
          }
        },
        {
          rootMargin: '50px', // Start loading before entering viewport
          threshold: 0.01,
        }
      );

      observerRef.current.observe(currentImageRef);
    } catch (_error) {
      // Fallback if Intersection Observer is not supported
      console.warn('Intersection Observer not supported, loading image immediately');
      setIsVisible(true);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isVisible]);

  // Update display source when visible
  useEffect(() => {
    if (isVisible) {
      const normalizedSrc = normalizeImageSrc(src);
      setDisplaySrc(normalizedSrc);
    }
  }, [isVisible, src, normalizeImageSrc]);

  // Handle image load
  const handleLoad = useCallback(() => {
    // Clear any pending timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Add small delay to prevent flashing on fast connections
    loadingTimeoutRef.current = setTimeout(() => {
      setImageState('loaded');
      onLoad?.();
    }, LOADING_DELAY);
  }, [onLoad]);

  // Handle image error with fallback
  const handleError = useCallback(() => {
    console.warn(`Failed to load image: ${displaySrc}`);

    // Try fallback image if not already using it
    if (displaySrc !== FALLBACK_IMAGE) {
      setDisplaySrc(FALLBACK_IMAGE);
      // Don't set error state yet, give fallback a chance
    } else {
      // Fallback also failed, show error state
      setImageState('error');
      onError?.();
    }
  }, [displaySrc, onError]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn('relative overflow-hidden bg-gray-100', className)}
      style={{
        aspectRatio,
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
      }}
    >
      {/* Loading state */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200" />
        </div>
      )}

      {/* Error state */}
      {imageState === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <svg
              className="w-12 h-12 mx-auto text-gray-400 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-500">Image unavailable</p>
          </div>
        </div>
      )}

      {/* Main image */}
      {isVisible && (
        <img
          ref={imageRef}
          src={displaySrc}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            // Ensure image fills container
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      )}

      {/* Accessibility: Loading announcement */}
      {imageState === 'loading' && (
        <span className="sr-only" role="status">
          Loading image: {alt}
        </span>
      )}
    </div>
  );
});

export default RobustProductImage;
