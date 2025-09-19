import { useCallback } from 'react';
import { analytics } from '@/services/analytics';
import type { Product as SupabaseProduct } from '@/types/database';
import type { Product as AppProduct } from '@/hooks/useProducts';
import type { CartItem } from '@/hooks/useCart';

/**
 * Convert AppProduct to SupabaseProduct format for analytics
 */
function convertToSupabaseProduct(product: AppProduct): SupabaseProduct {
  // Get the first variant's price if available, otherwise default to 0
  const price =
    product.variants && product.variants.length > 0 && product.variants[0]
      ? product.variants[0].price
      : 0;

  return {
    id: product.id,
    name: product.name,
    slug: product.name.toLowerCase().replace(/\s+/g, '-'),
    description: product.description,
    category: product.category,
    price: price,
    thc_content: product.thc_content,
    cbd_content: product.cbd_content,
    strain_type: null,
    effects: null,
    flavors: null,
    image_url: product.image_url,
    gallery_urls: null,
    stock_quantity: 0,
    is_featured: false,
    is_active: product.is_active,
    weight_grams: null,
    lab_tested: false,
    lab_results_url: null,
    created_at: product.created_at,
    updated_at: product.updated_at,
  };
}

/**
 * Custom hook for analytics tracking
 * Provides easy access to analytics methods
 */
export function useAnalytics() {
  // Product tracking
  const trackProductView = useCallback((product: AppProduct) => {
    const supabaseProduct = convertToSupabaseProduct(product);
    analytics.trackProductView(supabaseProduct);
  }, []);

  const trackAddToCart = useCallback((product: AppProduct, quantity: number) => {
    const supabaseProduct = convertToSupabaseProduct(product);
    analytics.trackAddToCart(supabaseProduct, quantity);
  }, []);

  const trackRemoveFromCart = useCallback((item: CartItem) => {
    analytics.trackRemoveFromCart(item);
  }, []);

  const trackProductClick = useCallback(
    (product: AppProduct, listName: string, position: number) => {
      const supabaseProduct = convertToSupabaseProduct(product);
      analytics.trackProductClick(supabaseProduct, listName, position);
    },
    []
  );

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
