// src/lib/react-query/config.ts
import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import type { APIError } from '@/lib/api/client';

/**
 * React Query Configuration
 * Optimized for performance with intelligent caching, retry logic,
 * and comprehensive error handling
 */

// Retry logic based on error type
const shouldRetryRequest = (failureCount: number, error: unknown): boolean => {
  // Don't retry on client errors (4xx)
  if (error instanceof Error && 'statusCode' in error) {
    const apiError = error as APIError;
    if (apiError.statusCode >= 400 && apiError.statusCode < 500) {
      return false;
    }
  }

  // Retry up to 3 times for other errors
  return failureCount < 3;
};

// Global error handler
const handleGlobalError = (error: unknown): void => {
  logger.error('React Query Global Error', error as Error);

  // Handle specific error types
  if (error instanceof Error && 'statusCode' in error) {
    const apiError = error as APIError;

    switch (apiError.statusCode) {
      case 401:
        // Handle unauthorized - redirect to login
        window.location.href = '/login';
        break;
      case 403:
        // Handle forbidden
        logger.warn('Access forbidden', { details: apiError.details });
        break;
      case 429:
        // Handle rate limiting
        logger.warn('Rate limit exceeded', { details: apiError.details });
        break;
    }
  }
};

// Query client configuration
const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Stale time: data is fresh for 5 minutes
      staleTime: 5 * 60 * 1000,

      // Cache time: keep data in cache for 10 minutes after becoming inactive
      gcTime: 10 * 60 * 1000,

      // Refetch on window focus only if data is stale
      refetchOnWindowFocus: 'always',

      // Don't refetch on reconnect unless data is stale
      refetchOnReconnect: 'always',

      // Retry configuration
      retry: shouldRetryRequest,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Network mode
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry failed mutations
      retry: 2,
      retryDelay: 1000,

      // Network mode
      networkMode: 'offlineFirst',

      // Global error handler
      onError: handleGlobalError,
    },
  },
};

// Create query client instance
export const queryClient = new QueryClient(queryClientConfig);

// Query key factory for consistent key generation
export const queryKeys = {
  all: ['api'] as const,

  // Products
  products: {
    all: () => [...queryKeys.all, 'products'] as const,
    lists: () => [...queryKeys.products.all(), 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },

  // Orders
  orders: {
    all: () => [...queryKeys.all, 'orders'] as const,
    lists: () => [...queryKeys.orders.all(), 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },

  // Cart
  cart: {
    all: () => [...queryKeys.all, 'cart'] as const,
    current: () => [...queryKeys.cart.all(), 'current'] as const,
  },

  // User
  user: {
    all: () => [...queryKeys.all, 'user'] as const,
    profile: () => [...queryKeys.user.all(), 'profile'] as const,
    preferences: () => [...queryKeys.user.all(), 'preferences'] as const,
  },
} as const;

// Cache invalidation helpers
export const invalidateQueries = {
  // Invalidate all queries
  all: () => queryClient.invalidateQueries({ queryKey: queryKeys.all }),

  // Invalidate specific query groups
  products: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all() }),
  orders: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() }),
  cart: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart.all() }),
  user: () => queryClient.invalidateQueries({ queryKey: queryKeys.user.all() }),
};

// Prefetch helpers
export const prefetchQuery = {
  productDetail: (id: string) =>
    queryClient.prefetchQuery({
      queryKey: queryKeys.products.detail(id),
      staleTime: 10 * 60 * 1000, // 10 minutes
    }),

  productList: (filters?: Record<string, unknown>) =>
    queryClient.prefetchQuery({
      queryKey: queryKeys.products.list(filters),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),
};

// Optimistic update helpers
export const optimisticUpdates = {
  // Add item to cart optimistically
  addToCart: (item: unknown) => {
    queryClient.setQueryData(queryKeys.cart.current(), (old: unknown) => {
      if (!old || typeof old !== 'object') return old;

      const cart = old as { items: unknown[] };
      return {
        ...cart,
        items: [...cart.items, item],
      };
    });
  },

  // Remove item from cart optimistically
  removeFromCart: (itemId: string) => {
    queryClient.setQueryData(queryKeys.cart.current(), (old: unknown) => {
      if (!old || typeof old !== 'object') return old;

      const cart = old as { items: Array<{ id: string }> };
      return {
        ...cart,
        items: cart.items.filter((item) => item.id !== itemId),
      };
    });
  },
};

// Export types
export type { QueryClient } from '@tanstack/react-query';
