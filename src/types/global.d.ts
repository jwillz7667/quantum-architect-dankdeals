// Global type declarations
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    google?: typeof google;
    initDeliveryAreaMap?: () => void;
  }
}

export {};
