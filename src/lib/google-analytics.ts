// Google Analytics 4 implementation
// Only use this if you're NOT using Google Tag Manager for GA4

const GA_MEASUREMENT_ID = import.meta.env['VITE_GA_MEASUREMENT_ID'] as string | undefined;

/**
 * Initialize Google Analytics 4
 * Call this once in your main App component
 */
export function initializeGA(): void {
  if (!GA_MEASUREMENT_ID) {
    console.info('Google Analytics not configured');
    return;
  }

  // Add gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll send page views manually
  });
}

/**
 * Track page views
 */
export function trackPageView(path: string, title?: string): void {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
}

/**
 * Track custom events
 */
export function trackEvent(eventName: string, parameters?: Record<string, unknown>): void {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;

  window.gtag('event', eventName, parameters);
}

/**
 * Track ecommerce events (GA4 format)
 */
export const GA4Events = {
  viewItem: (params: {
    currency: string;
    value: number;
    items: Array<{
      item_id: string;
      item_name: string;
      item_category?: string;
      price: number;
      quantity: number;
    }>;
  }) => {
    trackEvent('view_item', params);
  },

  addToCart: (params: {
    currency: string;
    value: number;
    items: Array<{
      item_id: string;
      item_name: string;
      item_category?: string;
      price: number;
      quantity: number;
    }>;
  }) => {
    trackEvent('add_to_cart', params);
  },

  beginCheckout: (params: {
    currency: string;
    value: number;
    items: Array<{
      item_id: string;
      item_name: string;
      item_category?: string;
      price: number;
      quantity: number;
    }>;
  }) => {
    trackEvent('begin_checkout', params);
  },

  purchase: (params: {
    transaction_id: string;
    currency: string;
    value: number;
    tax?: number;
    shipping?: number;
    items: Array<{
      item_id: string;
      item_name: string;
      item_category?: string;
      price: number;
      quantity: number;
    }>;
  }) => {
    trackEvent('purchase', params);
  },
};
