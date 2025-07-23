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
  const [hasError, setHasError] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);

  const logoPath =
    variant === 'cart'
      ? '/assets/logos/dankdeals-cart-logo.svg'
      : '/assets/logos/dankdeals-logo.svg';

  // For main logo, fetch SVG content and inject Bio Sans font style
  useEffect(() => {
    if (variant === 'main' && !hasError) {
      fetch(logoPath)
        .then((response) => response.text())
        .then((svg) => {
          // Update the SVG to use the loaded Bio Sans font
          const updatedSvg = svg.replace(
            "font-family:BioSans-Bold, 'Bio Sans'",
            "font-family:'Bio Sans', BioSans-Bold, sans-serif"
          );
          setSvgContent(updatedSvg);
        })
        .catch(() => {
          setHasError(true);
        });
    }
  }, [logoPath, variant, hasError]);

  const handleError = () => {
    setHasError(true);
  };

  if (hasError) {
    // Fallback to styled text logo with Bio Sans font
    return (
      <div
        className={`${className} flex items-center justify-center text-primary`}
        style={{ fontFamily: "'Bio Sans', sans-serif", fontWeight: 700 }}
      >
        DankDeals
      </div>
    );
  }

  // For main variant with fetched SVG content, render inline SVG
  if (variant === 'main' && svgContent) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: svgContent }}
        style={{ display: 'flex', alignItems: 'center' }}
      />
    );
  }

  // For cart variant or while loading, use img tag
  return (
    <img
      src={logoPath}
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
