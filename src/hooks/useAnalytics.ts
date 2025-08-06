import { useCallback } from 'react';
import { analytics } from '@/services/analytics';
import type { Product } from '@/integrations/supabase/types';
import type { CartItem } from '@/hooks/useCart';

/**
 * Custom hook for analytics tracking
 * Provides easy access to analytics methods
 */
export function useAnalytics() {
  // Product tracking
  const trackProductView = useCallback((product: Product) => {
    analytics.trackProductView(product);
  }, []);

  const trackAddToCart = useCallback((product: Product, quantity: number) => {
    analytics.trackAddToCart(product, quantity);
  }, []);

  const trackRemoveFromCart = useCallback((item: CartItem) => {
    analytics.trackRemoveFromCart(item);
  }, []);

  const trackProductClick = useCallback((product: Product, listName: string, position: number) => {
    analytics.trackProductClick(product, listName, position);
  }, []);

  // Checkout tracking
  const trackBeginCheckout = useCallback((items: CartItem[], total: number) => {
    analytics.trackBeginCheckout(items, total);
  }, []);

  const trackPurchase = useCallback(
    (
      orderId: string,
      items: CartItem[],
      total: number,
      tax: number,
      shipping: number,
      coupon?: string
    ) => {
      analytics.trackPurchase(orderId, items, total, tax, shipping, coupon);
    },
    []
  );

  // User tracking
  const trackLogin = useCallback((method: string) => {
    analytics.trackLogin(method);
  }, []);

  const trackSignUp = useCallback((method: string) => {
    analytics.trackSignUp(method);
  }, []);

  // Search tracking
  const trackSearch = useCallback((searchTerm: string, resultsCount: number) => {
    analytics.trackSearch(searchTerm, resultsCount);
  }, []);

  // Custom events
  const trackAgeVerification = useCallback((verified: boolean) => {
    analytics.trackAgeVerification(verified);
  }, []);

  const trackDeliveryAreaCheck = useCallback((zipCode: string, inDeliveryArea: boolean) => {
    analytics.trackDeliveryAreaCheck(zipCode, inDeliveryArea);
  }, []);

  const trackPromoCodeUsed = useCallback((code: string, discount: number, success: boolean) => {
    analytics.trackPromoCodeUsed(code, discount, success);
  }, []);

  const trackError = useCallback(
    (errorType: string, errorMessage: string, errorLocation?: string) => {
      analytics.trackError(errorType, errorMessage, errorLocation);
    },
    []
  );

  return {
    // Product events
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackProductClick,

    // Checkout events
    trackBeginCheckout,
    trackPurchase,

    // User events
    trackLogin,
    trackSignUp,

    // Search events
    trackSearch,

    // Custom events
    trackAgeVerification,
    trackDeliveryAreaCheck,
    trackPromoCodeUsed,
    trackError,

    // Direct access to analytics service
    analytics,
  };
}
