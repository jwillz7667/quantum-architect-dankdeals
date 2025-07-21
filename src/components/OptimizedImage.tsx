import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
  sizes,
  priority = false,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Always load images immediately if priority is set or loading is eager
    if (priority || loading === 'eager') {
      setIsInView(true);
      return;
    }

    // Set up IntersectionObserver for lazy loading
    const setupObserver = () => {
      if (!imgRef.current) return;

      // Check if IntersectionObserver is supported
      if (!('IntersectionObserver' in window)) {
        // Fallback for browsers that don't support IntersectionObserver
        setIsInView(true);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry?.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        {
          threshold: 0.1,
          rootMargin: '50px',
        }
      );

      observer.observe(imgRef.current);
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(setupObserver, 100);

    // Fallback: If image hasn't loaded after 2 seconds, force load it
    const fallbackTimeoutId = setTimeout(() => {
      if (!isInView) {
        console.warn(`Image ${src} not loaded after 2s, forcing load`);
        setIsInView(true);
      }
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(fallbackTimeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [priority, loading, src, isInView]);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  return (
    <div className={cn('overflow-hidden bg-muted', className)} style={{ width, height }}>
      {!isLoaded && !hasError && (
        <div
          className="animate-pulse bg-muted flex items-center justify-center"
          style={{ width: '100%', height: '100%' }}
        >
          <span className="text-muted-foreground text-sm">Loading...</span>
        </div>
      )}
      {hasError && (
        <div
          className="bg-muted flex items-center justify-center"
          style={{ width: '100%', height: '100%' }}
        >
          <span className="text-muted-foreground text-sm">Image not available</span>
        </div>
      )}
      <img
        ref={imgRef}
        src={isInView ? src : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        sizes={sizes}
        onLoad={() => {
          setIsLoaded(true);
          setHasError(false);
        }}
        onError={(e) => {
          console.error(`Failed to load image: ${src}`, e);
          setHasError(true);
          setIsLoaded(false);
        }}
        className={cn(
          'transition-opacity duration-300',
          isLoaded && !hasError ? 'opacity-100' : 'opacity-0',
          className
        )}
        style={{
          display: isLoaded && !hasError ? 'block' : 'none',
        }}
      />
    </div>
  );
}
