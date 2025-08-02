import { useState, useEffect } from 'react';
import { getWhiteLogoUrl } from '@/lib/logoStorage';

interface OptimizedLogoProps {
  className?: string;
  alt?: string;
  priority?: boolean; // For above-the-fold logos
}

export function OptimizedLogo({
  className = 'h-10 w-auto',
  alt = 'DankDeals',
  priority = false,
}: OptimizedLogoProps) {
  const [hasError, setHasError] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    // Get the white logo URL from Supabase storage
    const url = getWhiteLogoUrl();
    setLogoUrl(url);
  }, []);

  const handleError = () => {
    setHasError(true);
  };

  if (hasError) {
    // Fallback to styled text logo with white text for visibility on green background
    return (
      <div
        className={`${className} flex items-center justify-center text-white font-bold tracking-wide`}
      >
        DankDeals
      </div>
    );
  }

  // Use the white logo from Supabase storage
  return (
    <img
      src={logoUrl}
      alt={alt}
      className={className}
      onError={handleError}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      // Add fetchpriority for critical above-the-fold logos
      {...(priority && { fetchpriority: 'high' as const })}
    />
  );
}
