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
  srcSet?: string;
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
  srcSet,
  priority = false,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority || loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, loading]);

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
        srcSet={srcSet}
        onLoad={() => {
          setIsLoaded(true);
          setHasError(false);
        }}
        onError={() => {
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
