// src/lib/react-query/hooks/useOptimizedProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { queryKeys, prefetchQuery } from '@/lib/react-query/config';
import type { Product, ProductVariant } from '@/hooks/useProducts';

/**
 * Optimized Product Hooks
 * Implements intelligent caching, prefetching, and optimistic updates
 */

// Product schemas for validation
const productVariantSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  name: z.string(),
  price: z.number(),
  weight_grams: z.number(),
  inventory_count: z.number(),
  is_active: z.boolean().default(true),
});

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  image_url: z.string(),
  thc_content: z.string().nullable(),
  cbd_content: z.string().nullable(),
  strain_type: z.string().nullable(),
  effects: z.array(z.string()).nullable(),
  terpenes: z.array(z.string()).nullable(),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
  variants: z.array(productVariantSchema).optional(),
});

const productsResponseSchema = z.array(productSchema);

// Fetch products with optimized caching
export const useOptimizedProducts = (filters?: {
  category?: string;
  search?: string;
  sortBy?: 'name' | 'price' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: async () => {
      const response = await apiClient.get('/products', {
        params: {
          ...(filters?.category && { category: filters.category }),
          ...(filters?.search && { search: filters.search }),
          ...(filters?.sortBy && { sort_by: filters.sortBy }),
          ...(filters?.sortOrder && { sort_order: filters.sortOrder }),
          is_active: true,
        },
        schema: productsResponseSchema,
      });

      // Prefetch individual product details for better UX
      const products = response as Product[];
      if (Array.isArray(products)) {
        products.forEach((product) => {
          queryClient.setQueryData(queryKeys.products.detail(product.id), product);
        });
      }

      return products;
    },
    // Keep data fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Keep in cache for 10 minutes
    gcTime: 10 * 60 * 1000,
    // Refetch when window regains focus
    refetchOnWindowFocus: true,
    // Enable placeholder data while loading
    placeholderData: (previousData) => previousData,
  });
};

// Fetch single product with prefetching
export const useOptimizedProduct = (
  id: string,
  options?: {
    enabled?: boolean;
    prefetchRelated?: boolean;
  }
) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: async () => {
      const response = await apiClient.get(`/products/${id}`, {
        schema: productSchema,
      });

      // Prefetch related products if enabled
      const product = response as Product;
      if (options?.prefetchRelated && product.category) {
        void prefetchQuery.productList({ category: product.category });
      }

      return product;
    },
    enabled: options?.enabled ?? true,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    // Try to use cached data first
    initialData: () => {
      // Check if we have this product in the list cache
      const cachedLists = queryClient.getQueriesData({
        queryKey: queryKeys.products.lists(),
      });

      for (const [, data] of cachedLists) {
        if (Array.isArray(data)) {
          const product = data.find(
            (p: unknown) =>
              typeof p === 'object' && p !== null && 'id' in p && (p as Product).id === id
          ) as Product | undefined;
          if (product) return product;
        }
      }

      return undefined;
    },
  });
};

// Optimistic cart mutations
export const useAddToCartMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { product: Product; variant: ProductVariant; quantity: number }) => {
      // In a real app, this would call the API
      // For now, we'll simulate the operation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, cartItem: { ...data, id: crypto.randomUUID() } });
        }, 500);
      });
    },
    // Optimistic update
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.current() });

      // Snapshot previous value
      const previousCart = queryClient.getQueryData(queryKeys.cart.current());

      // Optimistically update cart
      queryClient.setQueryData(queryKeys.cart.current(), (old: unknown) => {
        const newItem = {
          id: crypto.randomUUID(),
          productId: data.product.id,
          variantId: data.variant.id,
          name: data.product.name,
          price: data.variant.price,
          quantity: data.quantity,
          addedAt: new Date().toISOString(),
        };

        const cart = old as { items?: unknown[]; totalItems?: number } | undefined;
        return {
          ...cart,
          items: [...(cart?.items || []), newItem],
          totalItems: (cart?.totalItems || 0) + data.quantity,
        };
      });

      // Return context with snapshot
      return { previousCart };
    },
    // Rollback on error
    onError: (_err, _data, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart.current(), context.previousCart);
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart.current() });
    },
  });
};

// Prefetch products for improved navigation
export const usePrefetchProducts = () => {
  const queryClient = useQueryClient();

  return {
    prefetchProduct: (id: string) => {
      return queryClient.prefetchQuery({
        queryKey: queryKeys.products.detail(id),
        queryFn: async () => {
          const response = await apiClient.get(`/products/${id}`, {
            schema: productSchema,
          });
          return response as Product;
        },
        staleTime: 10 * 60 * 1000,
      });
    },

    prefetchCategory: (category: string) => {
      return queryClient.prefetchQuery({
        queryKey: queryKeys.products.list({ category }),
        queryFn: async () => {
          const response = await apiClient.get('/products', {
            params: { category, is_active: true },
            schema: productsResponseSchema,
          });
          return response as Product[];
        },
        staleTime: 5 * 60 * 1000,
      });
    },
  };
};

// Infinite query for product pagination
export const useInfiniteProducts = (
  pageSize = 20,
  filters?: {
    category?: string;
    search?: string;
  }
) => {
  return useQuery({
    queryKey: [...queryKeys.products.list(filters), 'infinite'],
    queryFn: async ({ pageParam = 0 }: { pageParam?: number }) => {
      const response = await apiClient.get('/products', {
        params: {
          offset: pageParam * pageSize,
          limit: pageSize,
          ...(filters?.category && { category: filters.category }),
          ...(filters?.search && { search: filters.search }),
          is_active: true,
        },
        schema: z.object({
          products: productsResponseSchema,
          total: z.number(),
          hasMore: z.boolean(),
        }),
      });

      const result = response as { products: Product[]; hasMore: boolean };
      return {
        products: result.products,
        nextPage: result.hasMore ? (pageParam || 0) + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage: { nextPage?: number }) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000,
  });
};
