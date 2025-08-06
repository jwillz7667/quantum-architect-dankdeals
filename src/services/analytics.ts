import type { Product } from '@/integrations/supabase/types';
import type { CartItem } from '@/hooks/useCart';

/**
 * Comprehensive Analytics Service
 * Handles both GTM and GA4 tracking for all events
 */

interface AnalyticsProduct {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_variant?: string;
  price: number;
  quantity: number;
  item_brand?: string;
  index?: number;
}

interface UserProperties {
  user_id?: string;
  user_type?: 'guest' | 'registered' | 'medical';
  age_verified?: boolean;
  location?: string;
}

class AnalyticsService {
  private isInitialized = false;
  private userProperties: UserProperties = {};

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined') return;

    window.dataLayer = window.dataLayer || [];
    this.isInitialized = true;

    // Set default user properties
    this.userProperties = {
      age_verified: localStorage.getItem('age_verified') === 'true',
      user_type: 'guest',
    };
  }

  private pushEvent(eventName: string, parameters: Record<string, unknown> = {}) {
    if (!this.isInitialized || !window.dataLayer) return;

    const event = {
      event: eventName,
      ...parameters,
      ...this.userProperties,
      timestamp: new Date().toISOString(),
    };

    window.dataLayer.push(event);

    // Log in development
    if (import.meta.env.DEV) {
      console.log('📊 Analytics Event:', event);
    }
  }

  private formatProduct(product: Product, quantity = 1, index?: number): AnalyticsProduct {
    return {
      item_id: product.id,
      item_name: product.name,
      item_category: product.category_id || 'uncategorized',
      item_category2: undefined,
      item_category3: undefined,
      item_variant: product.strain_type || undefined,
      price: product.price,
      quantity,
      item_brand: 'DankDeals',
      index,
    };
  }

  private formatCartItem(item: CartItem, index?: number): AnalyticsProduct {
    return {
      item_id: item.productId,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      quantity: item.quantity,
      index,
    };
  }

  // User Events
  setUser(userId: string, userType: 'guest' | 'registered' | 'medical') {
    this.userProperties = {
      ...this.userProperties,
      user_id: userId,
      user_type: userType,
    };

    this.pushEvent('user_set', {
      user_id: userId,
      user_type: userType,
    });
  }

  // Page View Events
  trackPageView(pageName: string, pageCategory?: string) {
    this.pushEvent('page_view', {
      page_name: pageName,
      page_category: pageCategory,
      page_location: window.location.href,
      page_path: window.location.pathname,
    });
  }

  // Ecommerce Events
  trackProductView(product: Product) {
    this.pushEvent('view_item', {
      currency: 'USD',
      value: product.price,
      items: [this.formatProduct(product)],
    });
  }

  trackProductListView(products: Product[], listName: string) {
    this.pushEvent('view_item_list', {
      item_list_id: listName.toLowerCase().replace(/\s+/g, '_'),
      item_list_name: listName,
      items: products.map((p, i) => this.formatProduct(p, 1, i)),
    });
  }

  trackAddToCart(product: Product, quantity: number) {
    this.pushEvent('add_to_cart', {
      currency: 'USD',
      value: product.price * quantity,
      items: [this.formatProduct(product, quantity)],
    });
  }

  trackRemoveFromCart(item: CartItem) {
    this.pushEvent('remove_from_cart', {
      currency: 'USD',
      value: item.price * item.quantity,
      items: [this.formatCartItem(item)],
    });
  }

  trackViewCart(items: CartItem[], total: number) {
    this.pushEvent('view_cart', {
      currency: 'USD',
      value: total,
      items: items.map((item, i) => this.formatCartItem(item, i)),
    });
  }

  trackBeginCheckout(items: CartItem[], total: number) {
    this.pushEvent('begin_checkout', {
      currency: 'USD',
      value: total,
      items: items.map((item, i) => this.formatCartItem(item, i)),
      coupon: localStorage.getItem('applied_coupon') || undefined,
    });
  }

  trackAddPaymentInfo(paymentMethod: string) {
    this.pushEvent('add_payment_info', {
      payment_type: paymentMethod,
    });
  }

  trackAddShippingInfo(shippingMethod: string, shippingCost: number) {
    this.pushEvent('add_shipping_info', {
      shipping_tier: shippingMethod,
      value: shippingCost,
      currency: 'USD',
    });
  }

  trackPurchase(
    orderId: string,
    items: CartItem[],
    total: number,
    tax: number,
    shipping: number,
    coupon?: string
  ) {
    this.pushEvent('purchase', {
      transaction_id: orderId,
      currency: 'USD',
      value: total,
      tax,
      shipping,
      coupon,
      items: items.map((item, i) => this.formatCartItem(item, i)),
    });

    // Also track as conversion
    this.trackConversion('purchase', total);
  }

  // Search Events
  trackSearch(searchTerm: string, resultsCount: number) {
    this.pushEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount,
    });
  }

  // User Engagement Events
  trackSignUp(method: string) {
    this.pushEvent('sign_up', {
      method,
    });
  }

  trackLogin(method: string) {
    this.pushEvent('login', {
      method,
    });
  }

  trackShare(contentType: string, itemId: string, method: string) {
    this.pushEvent('share', {
      content_type: contentType,
      item_id: itemId,
      method,
    });
  }

  // Custom Events
  trackAgeVerification(verified: boolean) {
    this.userProperties.age_verified = verified;
    this.pushEvent('age_verification', {
      verified,
      age_gate_passed: verified,
    });
  }

  trackDeliveryAreaCheck(zipCode: string, inDeliveryArea: boolean) {
    this.pushEvent('delivery_area_check', {
      zip_code: zipCode,
      in_delivery_area: inDeliveryArea,
    });
  }

  trackPromoCodeUsed(code: string, discount: number, success: boolean) {
    this.pushEvent('promo_code_used', {
      promotion_id: code,
      promotion_name: code,
      discount_amount: discount,
      success,
    });
  }

  trackProductFilter(filterType: string, filterValue: string) {
    this.pushEvent('product_filter', {
      filter_type: filterType,
      filter_value: filterValue,
    });
  }

  trackProductSort(sortType: string) {
    this.pushEvent('product_sort', {
      sort_type: sortType,
    });
  }

  // Conversion Events
  trackConversion(conversionType: string, value?: number) {
    this.pushEvent('conversion', {
      conversion_type: conversionType,
      value,
      currency: value ? 'USD' : undefined,
    });
  }

  // Error Tracking
  trackError(errorType: string, errorMessage: string, errorLocation?: string) {
    this.pushEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
      error_location: errorLocation || window.location.pathname,
    });
  }

  // Performance Tracking
  trackTiming(category: string, variable: string, time: number, label?: string) {
    this.pushEvent('timing_complete', {
      timing_category: category,
      timing_variable: variable,
      timing_time: time,
      timing_label: label,
    });
  }

  // Enhanced Ecommerce - Product Interactions
  trackProductClick(product: Product, listName: string, position: number) {
    this.pushEvent('select_item', {
      item_list_id: listName.toLowerCase().replace(/\s+/g, '_'),
      item_list_name: listName,
      items: [this.formatProduct(product, 1, position)],
    });
  }

  trackPromotionView(promotionId: string, promotionName: string, creative?: string) {
    this.pushEvent('view_promotion', {
      promotion_id: promotionId,
      promotion_name: promotionName,
      creative_name: creative,
      creative_slot: 'homepage_banner',
    });
  }

  trackPromotionClick(promotionId: string, promotionName: string, creative?: string) {
    this.pushEvent('select_promotion', {
      promotion_id: promotionId,
      promotion_name: promotionName,
      creative_name: creative,
      creative_slot: 'homepage_banner',
    });
  }

  // Session & Engagement Metrics
  trackEngagement(engagementTime: number, engagementType: string) {
    this.pushEvent('user_engagement', {
      engagement_time_msec: engagementTime,
      engagement_type: engagementType,
    });
  }

  trackScroll(percentage: number) {
    this.pushEvent('scroll', {
      scroll_percentage: percentage,
    });
  }

  // Video Tracking (if you have product videos)
  trackVideoStart(videoTitle: string, videoId: string) {
    this.pushEvent('video_start', {
      video_title: videoTitle,
      video_id: videoId,
    });
  }

  trackVideoProgress(videoTitle: string, videoId: string, percentage: number) {
    this.pushEvent('video_progress', {
      video_title: videoTitle,
      video_id: videoId,
      video_percent: percentage,
    });
  }

  trackVideoComplete(videoTitle: string, videoId: string) {
    this.pushEvent('video_complete', {
      video_title: videoTitle,
      video_id: videoId,
    });
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();
