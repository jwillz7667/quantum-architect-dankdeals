import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SimpleImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}

export function SimpleImage({ src, alt, className, fallback }: SimpleImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // If WebP fails, try without .webp extension
  const fallbackSrc = fallback || src.replace('.webp', '.jpg');

  return (
    <>
      {loading && <div className={cn('animate-pulse bg-gray-200', className)} />}
      <img
        src={error ? fallbackSrc : src}
        alt={alt}
        className={cn(className, loading && 'hidden')}
        onLoad={() => setLoading(false)}
        onError={() => {
          if (!error) {
            setError(true);
          }
        }}
      />
    </>
  );
}
