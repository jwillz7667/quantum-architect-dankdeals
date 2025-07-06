import { env } from './env';
import { logger } from './logger';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

class Analytics {
  private queue: AnalyticsEvent[] = [];
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    // Initialize Vercel Analytics in production
    if (env.VITE_ENV === 'production') {
      try {
        const { inject } = await import('@vercel/analytics');
        inject();
        this.isInitialized = true;
        logger.info('Vercel Analytics initialized');

        // Flush any queued events
        this.flushQueue();
      } catch (error) {
        logger.error('Failed to initialize Vercel Analytics', error as Error);
      }
    }

    // Initialize Plausible if configured
    if (env.VITE_PLAUSIBLE_DOMAIN) {
      this.initializePlausible();
    }
  }

  private initializePlausible() {
    const script = document.createElement('script');
    script.defer = true;
    script.dataset.domain = env.VITE_PLAUSIBLE_DOMAIN;
    script.src = env.VITE_PLAUSIBLE_API_HOST + '/js/script.js';
    document.head.appendChild(script);

    // Make plausible function available globally
    (window as any).plausible =
      (window as any).plausible ||
      function () {
        ((window as any).plausible.q = (window as any).plausible.q || []).push(arguments);
      };
  }

  track(eventName: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = { name: eventName, properties };

    // Queue events if not initialized
    if (!this.isInitialized && env.VITE_ENV === 'production') {
      this.queue.push(event);
      return;
    }

    // Send to Vercel Analytics
    if ((window as any).va) {
      (window as any).va('event', { name: eventName, data: properties });
    }

    // Send to Plausible
    if ((window as any).plausible) {
      (window as any).plausible(eventName, { props: properties });
    }

    // Log in development
    if (env.VITE_ENV === 'development') {
      logger.debug('Analytics event', { event: eventName, properties });
    }
  }

  pageView(path?: string) {
    const currentPath = path || window.location.pathname;

    // Vercel Analytics tracks page views automatically

    // Track in Plausible
    if ((window as any).plausible) {
      (window as any).plausible('pageview');
    }

    logger.debug('Page view', { path: currentPath });
  }

  identify(userId: string, traits?: Record<string, any>) {
    // For future use with customer analytics
    logger.debug('User identified', { userId, traits });
  }

  private flushQueue() {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) {
        this.track(event.name, event.properties);
      }
    }
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Common event names for consistency
export const AnalyticsEvents = {
  // User events
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  AGE_VERIFIED: 'age_verified',
  AGE_VERIFICATION_FAILED: 'age_verification_failed',

  // Product events
  PRODUCT_VIEWED: 'product_viewed',
  PRODUCT_ADDED_TO_CART: 'product_added_to_cart',
  PRODUCT_REMOVED_FROM_CART: 'product_removed_from_cart',

  // Checkout events
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_COMPLETED: 'checkout_completed',
  CHECKOUT_FAILED: 'checkout_failed',

  // Search events
  SEARCH_PERFORMED: 'search_performed',
  CATEGORY_VIEWED: 'category_viewed',
} as const;
