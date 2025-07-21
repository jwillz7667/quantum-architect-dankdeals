// src/components/ResponsiveImage.tsx
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  srcSet?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  aspectRatio?: string; // e.g., "16/9", "4/3", "1/1"
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export function ResponsiveImage({
  src,
  fallbackSrc,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
  sizes,
  srcSet,
  priority = false,
  onLoad,
  onError,
  aspectRatio = '1/1',
  objectFit = 'cover',
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority || loading === 'eager');
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (priority || loading === 'eager' || isInView) return;

    const img = imgRef.current;
    if (!img) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    observerRef.current.observe(img);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, loading, isInView]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  // Handle image error with fallback
  const handleError = () => {
    console.warn(`Failed to load image: ${currentSrc}`);

    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false); // Reset error state to try fallback
    } else {
      setHasError(true);
      setIsLoaded(false);
      onError?.();
    }
  };

  // Reset states when src changes
  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  return (
    <div
      className={cn('relative overflow-hidden bg-muted', className)}
      style={{
        width,
        height,
        aspectRatio: aspectRatio,
      }}
    >
      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center">
          <div className="text-muted-foreground">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="text-center text-muted-foreground p-4">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm">Image not available</p>
          </div>
        </div>
      )}

      {/* Main image */}
      <picture>
        {/* WebP source with fallback */}
        {currentSrc.endsWith('.webp') && (
          <source
            type="image/webp"
            srcSet={isInView ? srcSet || currentSrc : undefined}
            sizes={sizes}
          />
        )}

        {/* JPEG fallback */}
        {currentSrc.endsWith('.webp') && fallbackSrc && (
          <source type="image/jpeg" srcSet={isInView ? fallbackSrc : undefined} sizes={sizes} />
        )}

        <img
          ref={imgRef}
          src={isInView ? currentSrc : undefined}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoaded && !hasError ? 'opacity-100' : 'opacity-0',
            `object-${objectFit}`
          )}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
        />
      </picture>
    </div>
  );
}
