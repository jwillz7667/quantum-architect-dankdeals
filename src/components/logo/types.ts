export interface LogoProps {
  className?: string;
  alt?: string;
  priority?: boolean;
  variant?: 'default' | 'email';
  onLoad?: () => void;
  onError?: () => void;
}

export interface LogoImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onError: () => void;
  onLoad?: () => void;
}

export interface LogoFallbackProps {
  className?: string;
  text?: string;
}

export type LogoVariant = {
  primary: string;
  fallbacks: string[];
  type: 'svg' | 'png' | 'webp';
};