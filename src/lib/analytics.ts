import { env } from './env';
import { logger } from './logger';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
}

// Extend window to include Plausible
declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean> }
    ) => void;
  }
}

class Analytics {
  private queue: AnalyticsEvent[] = [];
  private isInitialized = false;

  initialize() {
    if (this.isInitialized) return;

    // Disable Vercel Analytics for now (causing MIME type errors)
    // TODO: Re-enable when properly configured with Vercel deployment

    this.isInitialized = true;
    logger.info('Analytics initialized (Plausible via HTML head)');

    // Flush any queued events
    this.flushQueue();
  }

  // Plausible is now initialized via HTML head script tag

  track(eventName: string, properties?: Record<string, string | number | boolean>) {
    const event: AnalyticsEvent = { name: eventName, properties };

    // Queue events if not initialized
    if (!this.isInitialized) {
      this.queue.push(event);
      return;
    }

    // Send to Plausible (initialized via HTML head script)
    if (window.plausible) {
      window.plausible(eventName, { props: properties });
    }

    // Log in development
    if (env.VITE_ENV === 'development') {
      logger.debug('Analytics event', { event: eventName, properties });
    }
  }

  pageView(path?: string) {
    const currentPath = path || window.location.pathname;

    // Track in Plausible (page views are tracked automatically by script)
    if (window.plausible) {
      window.plausible('pageview');
    }

    logger.debug('Page view', { path: currentPath });
  }

  identify(userId: string, traits?: Record<string, string | number | boolean>) {
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
