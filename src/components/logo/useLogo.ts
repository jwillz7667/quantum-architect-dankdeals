import { useState, useCallback, useMemo } from 'react';
import { LOGO_VARIANTS } from './constants';
import type { LogoProps } from './types';

export const useLogo = (variant: LogoProps['variant'] = 'default') => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hasExhaustedFallbacks, setHasExhaustedFallbacks] = useState(false);

  const logoConfig = useMemo(() => LOGO_VARIANTS[variant] || LOGO_VARIANTS['default'], [variant]);

  const allImages = useMemo(() => [
    logoConfig?.primary,
    ...(logoConfig?.fallbacks || [])
  ].filter(Boolean) as string[], [logoConfig]);

  const currentSrc = useMemo(() => {
    if (hasExhaustedFallbacks) return null;
    return allImages[currentImageIndex];
  }, [allImages, currentImageIndex, hasExhaustedFallbacks]);

  const handleError = useCallback(() => {
    if (currentImageIndex < allImages.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    } else {
      setHasExhaustedFallbacks(true);
    }
  }, [currentImageIndex, allImages.length]);

  const reset = useCallback(() => {
    setCurrentImageIndex(0);
    setHasExhaustedFallbacks(false);
  }, []);

  return {
    currentSrc,
    hasExhaustedFallbacks,
    handleError,
    reset,
    isSvg: logoConfig?.type === 'svg' && currentImageIndex === 0
  };
};