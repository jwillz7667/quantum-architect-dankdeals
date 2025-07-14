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

  // Preload the logo if it's priority (above the fold)
  useEffect(() => {
    if (priority) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = logoPath;
      link.as = 'image';
      link.type = 'image/svg+xml';
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, logoPath]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  if (hasError) {
    // Fallback to text logo if SVG fails to load
    return (
      <div className={`${className} flex items-center justify-center font-bold text-primary`}>
        DankDeals
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Placeholder while loading */}
      {!isLoaded && (
        <div
          className={`${className} bg-muted animate-pulse rounded`}
          style={{ aspectRatio: variant === 'cart' ? '1 / 1' : '2.5 / 1' }}
        />
      )}

      {/* Actual logo */}
      <img
        src={logoPath}
        alt={alt}
        className={`${className} ${!isLoaded ? 'opacity-0 absolute inset-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        // Add fetchpriority for critical above-the-fold logos
        {...(priority && { fetchPriority: 'high' as const })}
      />
    </div>
  );
}
