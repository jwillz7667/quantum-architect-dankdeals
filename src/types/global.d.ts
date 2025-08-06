// Global type declarations
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    google?: typeof google;
    initDeliveryAreaMap?: () => void;
  }
}

// Extend React HTML attributes to include fetchpriority
declare module 'react' {
  interface ImgHTMLAttributes<T> extends React.HTMLAttributes<T> {
    fetchpriority?: 'high' | 'low' | 'auto';
  }
}

export {};
