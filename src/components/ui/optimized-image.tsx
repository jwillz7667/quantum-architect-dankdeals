import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Preload priority images
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [src, priority]);

  if (error) {
    return (
      <div
        className={cn('bg-muted flex items-center justify-center', className)}
        style={{ width, height }}
      >
        <span className="text-muted-foreground text-sm">Image not found</span>
      </div>
    );
  }

  return (
    <>
      {!isLoaded && (
        <div className={cn('bg-muted animate-pulse', className)} style={{ width, height }} />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={cn(className, !isLoaded && 'hidden')}
        {...props}
      />
    </>
  );
}
