import { memo } from 'react';
import type { LogoFallbackProps } from './types';
import { DEFAULT_FALLBACK_TEXT } from './constants';

export const LogoFallback = memo(({ 
  className = 'h-10 w-auto', 
  text = DEFAULT_FALLBACK_TEXT 
}: LogoFallbackProps) => {
  return (
    <div
      className={`${className} flex items-center justify-center text-white font-bold tracking-wide`}
      role="img"
      aria-label={text}
    >
      {text}
    </div>
  );
});

LogoFallback.displayName = 'LogoFallback';