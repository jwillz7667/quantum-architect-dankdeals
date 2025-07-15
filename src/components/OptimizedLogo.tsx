import { useState, useEffect } from 'react';

interface OptimizedLogoProps {
  className?: string;
  alt?: string;
  priority?: boolean; // For above-the-fold logos
  variant?: 'main' | 'cart'; // Different logo variants
}

export function OptimizedLogo({
  className = 'h-10 w-auto',
  alt = 'DankDeals',
  priority = false,
  variant = 'main',
}: OptimizedLogoProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const logoPath =
    variant === 'cart'
      ? '/assets/logos/dankdeals-cart-logo.svg'
      : '/assets/logos/dankdeals-logo.svg';

  // Only preload logo for critical above-the-fold usage
  useEffect(() => {
    if (priority && !hasError && variant === 'main') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = logoPath;
      link.as = 'image';
      link.type = 'image/svg+xml';
      document.head.appendChild(link);

      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [priority, logoPath, hasError, variant]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  if (hasError || !isLoaded) {
    // Fallback to text logo if SVG fails to load or while loading
    return (
      <div className={`${className} flex items-center justify-center font-bold text-primary`}>
        DankDeals
      </div>
    );
  }

  return (
    <img
      src={logoPath}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      // Add fetchpriority for critical above-the-fold logos
      {...(priority && { fetchPriority: 'high' as const })}
    />
  );
}
