import type { LogoVariant } from './types';

export const LOGO_VARIANTS: Record<string, LogoVariant> = {
  default: {
    primary: '/logos/white-logo-trans-done.svg',
    fallbacks: [
      '/logos/white-logo-trans-done-tiny.png',
      '/logos/white-logo-trans-done.webp'
    ],
    type: 'svg'
  },
  email: {
    primary: '/logos/white-green-logo.svg',
    fallbacks: [
      '/logos/white-green-logo.png',
      '/logos/white-green-logo.webp'
    ],
    type: 'svg'
  }
};

export const DEFAULT_ALT_TEXT = 'DankDeals';
export const DEFAULT_FALLBACK_TEXT = 'DankDeals';