import { memo, useState, useCallback } from 'react';
import type { LogoImageProps } from './types';

export const LogoImage = memo(
  ({ src, alt, className, priority = false, onError, onLoad }: LogoImageProps) => {
    const [isLoading, setIsLoading] = useState(true);

    const handleLoad = useCallback(() => {
      setIsLoading(false);
      onLoad?.();
    }, [onLoad]);

    const handleError = useCallback(() => {
      setIsLoading(false);
      onError();
    }, [onError]);

    return (
      <>
        {isLoading && <div className={`${className} animate-pulse bg-gray-300 rounded`} />}
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoading ? 'hidden' : ''}`}
          onError={handleError}
          onLoad={handleLoad}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchpriority={priority ? 'high' : 'auto'}
        />
      </>
    );
  }
);

LogoImage.displayName = 'LogoImage';
