import { memo } from 'react';
import { LogoImage } from './LogoImage';
import { LogoFallback } from './LogoFallback';
import { useLogo } from './useLogo';
import { DEFAULT_ALT_TEXT } from './constants';
import type { LogoProps } from './types';

export const Logo = memo(({
  className = 'h-10 w-auto',
  alt = DEFAULT_ALT_TEXT,
  priority = false,
  variant = 'default',
  onLoad,
  onError
}: LogoProps) => {
  const { currentSrc, hasExhaustedFallbacks, handleError } = useLogo(variant);

  const handleImageError = () => {
    handleError();
    if (hasExhaustedFallbacks) {
      onError?.();
    }
  };

  if (hasExhaustedFallbacks || !currentSrc) {
    return <LogoFallback className={className} text={alt} />;
  }

  return (
    <LogoImage
      src={currentSrc}
      alt={alt}
      className={className}
      priority={priority}
      onError={handleImageError}
      onLoad={onLoad}
    />
  );
});

Logo.displayName = 'Logo';