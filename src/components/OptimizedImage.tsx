import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  sizes,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  className,
  onLoad,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.01,
        rootMargin: '50px',
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  // Generate srcSet for responsive images
  const generateSrcSet = () => {
    if (!width) return undefined;
    const widths = [320, 640, 768, 1024, 1280, 1536];
    return widths
      .filter((w) => w <= width * 2)
      .map((w) => {
        const params = new URLSearchParams({
          w: w.toString(),
          q: quality.toString(),
        });
        return `${src}?${params} ${w}w`;
      })
      .join(', ');
  };

  // Default sizes if not provided
  const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  return (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden', className)}
      style={{
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
      }}
    >
      {/* Placeholder */}
      {placeholder === 'blur' && !isLoaded && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{
            backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
          }}
        />
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          srcSet={generateSrcSet()}
          sizes={defaultSizes}
          onLoad={handleLoad}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          {...props}
        />
      )}
    </div>
  );
}

// Optimized product image with Supabase CDN support
export function OptimizedProductImage({
  src,
  alt,
  className,
  ...props
}: OptimizedImageProps) {
  // Add Supabase image transformation parameters
  const optimizedSrc = src.includes('supabase.co') 
    ? `${src}?quality=${props.quality || 75}&format=webp`
    : src;

  return (
    <OptimizedImage
      src={optimizedSrc}
      alt={alt}
      className={cn('aspect-square object-cover', className)}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      {...props}
    />
  );
}