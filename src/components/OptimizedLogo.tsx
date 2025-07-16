import { useState } from 'react';

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
  const [hasError, setHasError] = useState(false);

  const logoPath =
    variant === 'cart'
      ? '/assets/logos/dankdeals-cart-logo.svg'
      : '/assets/logos/dankdeals-logo.svg';

  const handleError = () => {
    setHasError(true);
  };

  if (hasError) {
    // Fallback to text logo only if SVG fails to load
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
      onError={handleError}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      // Add fetchpriority for critical above-the-fold logos
      {...(priority && { fetchPriority: 'high' as const })}
    />
  );
}
