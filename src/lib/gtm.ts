// Google Tag Manager utilities for React

interface GTMEvent {
  event: string;
  [key: string]: any;
}

/**
 * Push event to Google Tag Manager dataLayer
 */
export function pushToDataLayer(event: GTMEvent): void {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(event);
  }
}

/**
 * Track page view in GTM
 */
export function trackPageView(path: string, title?: string): void {
  pushToDataLayer({
    event: 'page_view',
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
}

/**
 * Track e-commerce events
 */
export const GTMEvents = {
  // Product views
  viewItem: (product: {
    id: string;
    name: string;
    category?: string;
    price: number;
    brand?: string;
  }) => {
    pushToDataLayer({
      event: 'view_item',
      ecommerce: {
        currency: 'USD',
        value: product.price,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            item_category: product.category,
            price: product.price,
            item_brand: product.brand || 'DankDeals',
            quantity: 1,
          },
        ],
      },
    });
  },

  // Add to cart
  addToCart: (product: {
    id: string;
    name: string;
    category?: string;
    price: number;
    quantity: number;
    brand?: string;
  }) => {
    pushToDataLayer({
      event: 'add_to_cart',
      ecommerce: {
        currency: 'USD',
        value: product.price * product.quantity,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            item_category: product.category,
            price: product.price,
            item_brand: product.brand || 'DankDeals',
            quantity: product.quantity,
          },
        ],
      },
    });
  },

  // Remove from cart
  removeFromCart: (product: {
    id: string;
    name: string;
    category?: string;
    price: number;
    quantity: number;
    brand?: string;
  }) => {
    pushToDataLayer({
      event: 'remove_from_cart',
      ecommerce: {
        currency: 'USD',
        value: product.price * product.quantity,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            item_category: product.category,
            price: product.price,
            item_brand: product.brand || 'DankDeals',
            quantity: product.quantity,
          },
        ],
      },
    });
  },

  // Begin checkout
  beginCheckout: (
    items: Array<{
      id: string;
      name: string;
      category?: string;
      price: number;
      quantity: number;
      brand?: string;
    }>,
    totalValue: number
  ) => {
    pushToDataLayer({
      event: 'begin_checkout',
      ecommerce: {
        currency: 'USD',
        value: totalValue,
        items: items.map((item) => ({
          item_id: item.id,
          item_name: item.name,
          item_category: item.category,
          price: item.price,
          item_brand: item.brand || 'DankDeals',
          quantity: item.quantity,
        })),
      },
    });
  },

  // Purchase
  purchase: (order: {
    id: string;
    items: Array<{
      id: string;
      name: string;
      category?: string;
      price: number;
      quantity: number;
      brand?: string;
    }>;
    totalValue: number;
    tax?: number;
    shipping?: number;
  }) => {
    pushToDataLayer({
      event: 'purchase',
      ecommerce: {
        transaction_id: order.id,
        currency: 'USD',
        value: order.totalValue,
        tax: order.tax || 0,
        shipping: order.shipping || 0,
        items: order.items.map((item) => ({
          item_id: item.id,
          item_name: item.name,
          item_category: item.category,
          price: item.price,
          item_brand: item.brand || 'DankDeals',
          quantity: item.quantity,
        })),
      },
    });
  },

  // Search
  search: (searchTerm: string, resultsCount?: number) => {
    pushToDataLayer({
      event: 'search',
      search_term: searchTerm,
      search_results_count: resultsCount,
    });
  },

  // User events
  signUp: (method: string) => {
    pushToDataLayer({
      event: 'sign_up',
      method: method,
    });
  },

  login: (method: string) => {
    pushToDataLayer({
      event: 'login',
      method: method,
    });
  },

  // Custom events
  ageVerified: (age: number) => {
    pushToDataLayer({
      event: 'age_verified',
      user_age: age,
    });
  },

  deliveryAreaSelected: (zipCode: string) => {
    pushToDataLayer({
      event: 'delivery_area_selected',
      zip_code: zipCode,
    });
  },
};

// Type declaration extends the one in google-analytics.ts
