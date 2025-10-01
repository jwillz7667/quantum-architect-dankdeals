import type { UseInfiniteQueryOptions, InfiniteData } from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/react-query/config';
import type { Product } from './useProducts';

// Mock data for fallback (same as in useProducts)
const MOCK_PRODUCTS: Product[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Pineapple Fruz',
    description:
      'A tropical-flavored hybrid strain with sweet pineapple notes and balanced effects.',
    image_url:
      'https://ralbzuvkyexortqngvxs.supabase.co/storage/v1/object/public/products/11111111-1111-1111-1111-111111111111/pineapple-fruz-1.webp',
    category: 'flower',
    thc_content: 22.5,
    cbd_content: 0.8,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    variants: [
      {
        id: 'var-pf-1',
        name: '1/8 oz',
        price: 35.0,
        weight_grams: 3.5,
        inventory_count: 10,
        is_active: true,
      },
      {
        id: 'var-pf-2',
        name: '1/4 oz',
        price: 65.0,
        weight_grams: 7.0,
        inventory_count: 5,
        is_active: true,
      },
    ],
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Rainbow Sherbert #11',
    description: 'A fruity indica-dominant hybrid with colorful buds and sweet berry flavors.',
    image_url:
      'https://ralbzuvkyexortqngvxs.supabase.co/storage/v1/object/public/products/22222222-2222-2222-2222-222222222222/rainbow-sherbert11-1.webp',
    category: 'flower',
    thc_content: 24.8,
    cbd_content: 0.5,
    is_active: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    variants: [
      {
        id: 'var-rs-1',
        name: '1/8 oz',
        price: 40.0,
        weight_grams: 3.5,
        inventory_count: 8,
        is_active: true,
      },
      {
        id: 'var-rs-2',
        name: '1/4 oz',
        price: 75.0,
        weight_grams: 7.0,
        inventory_count: 3,
        is_active: true,
      },
    ],
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Runtz',
    description: 'A popular hybrid strain known for its candy-like flavor and balanced effects.',
    image_url:
      'https://ralbzuvkyexortqngvxs.supabase.co/storage/v1/object/public/products/33333333-3333-3333-3333-333333333333/runtz-1.webp',
    category: 'flower',
    thc_content: 26.2,
    cbd_content: 0.3,
    is_active: true,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    variants: [
      {
        id: 'var-runtz-1',
        name: '1/8 oz',
        price: 45.0,
        weight_grams: 3.5,
        inventory_count: 6,
        is_active: true,
      },
      {
        id: 'var-runtz-2',
        name: '1/4 oz',
        price: 85.0,
        weight_grams: 7.0,
        inventory_count: 2,
        is_active: true,
      },
    ],
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Wedding Cake',
    description:
      'An indica-dominant hybrid with vanilla and earthy flavors, perfect for relaxation.',
    image_url:
      'https://ralbzuvkyexortqngvxs.supabase.co/storage/v1/object/public/products/44444444-4444-4444-4444-444444444444/wedding-cake-1.webp',
    category: 'flower',
    thc_content: 23.7,
    cbd_content: 0.6,
    is_active: true,
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
    variants: [
      {
        id: 'var-wc-1',
        name: '1/8 oz',
        price: 38.0,
        weight_grams: 3.5,
        inventory_count: 12,
        is_active: true,
      },
      {
        id: 'var-wc-2',
        name: '1/4 oz',
        price: 70.0,
        weight_grams: 7.0,
        inventory_count: 7,
        is_active: true,
      },
    ],
  },
];

export interface PaginatedProductsOptions {
  pageSize?: number;
  category?: string | null;
  search?: string;
  sortBy?: 'created_at' | 'name' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductsPage {
  products: Product[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: number;
}

/**
 * Fetches a page of products with pagination support
 */
async function fetchProductsPage(
  pageParam: number = 0,
  options: PaginatedProductsOptions = {}
): Promise<ProductsPage> {
  const { pageSize = 12, category, search, sortBy = 'created_at', sortOrder = 'desc' } = options;

  try {
    console.log('fetchProductsPage: Fetching page', pageParam, 'with options:', options);

    // Calculate range for Supabase pagination
    const from = pageParam * pageSize;
    const to = from + pageSize - 1;

    // Build query
    let query = supabase
      .from('products')
      .select(
        `
        *,
        variants:product_variants(*)
      `,
        { count: 'exact' }
      )
      .eq('is_active', true)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      // Use Supabase's text search for better performance
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    console.log('fetchProductsPage: Response:', {
      dataLength: data?.length,
      totalCount: count,
      error,
    });

    if (error) {
      // Check if it's a permissions error (RLS issue)
      if (
        error.message.includes('permission denied') ||
        error.message.includes('policy') ||
        error.code === 'PGRST116'
      ) {
        console.warn('Database access denied, using mock data:', error.message);

        // Return paginated mock data
        const mockFrom = from;
        const mockTo = Math.min(to, MOCK_PRODUCTS.length - 1);
        const paginatedMockProducts = MOCK_PRODUCTS.slice(mockFrom, mockTo + 1);

        return {
          products: paginatedMockProducts,
          totalCount: MOCK_PRODUCTS.length,
          hasMore: mockTo < MOCK_PRODUCTS.length - 1,
          nextCursor: mockTo < MOCK_PRODUCTS.length - 1 ? pageParam + 1 : undefined,
        };
      }
      throw error;
    }

    const processedProducts = (data || []).map((product) => ({
      ...product,
      is_active: product.is_active ?? true,
    }));

    const totalCount = count || 0;
    const hasMore = to < totalCount - 1;

    return {
      products: processedProducts,
      totalCount,
      hasMore,
      nextCursor: hasMore ? pageParam + 1 : undefined,
    };
  } catch (error) {
    console.error('Error fetching products page:', error);

    // Fallback to paginated mock data on any error
    const mockPageSize = options.pageSize || 12;
    const from = pageParam * mockPageSize;
    const to = Math.min(from + mockPageSize - 1, MOCK_PRODUCTS.length - 1);
    const paginatedMockProducts = MOCK_PRODUCTS.slice(from, to + 1);

    return {
      products: paginatedMockProducts,
      totalCount: MOCK_PRODUCTS.length,
      hasMore: to < MOCK_PRODUCTS.length - 1,
      nextCursor: to < MOCK_PRODUCTS.length - 1 ? pageParam + 1 : undefined,
    };
  }
}

/**
 * Hook for paginated products with infinite scroll support
 *
 * @param options - Pagination and filtering options
 * @returns Infinite query result with products, loading states, and pagination controls
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 *   isLoading
 * } = usePaginatedProducts({ pageSize: 12, category: 'flower' });
 *
 * // Render products
 * {data?.pages.map((page) =>
 *   page.products.map((product) => <ProductCard key={product.id} {...product} />)
 * )}
 *
 * // Load more button
 * {hasNextPage && (
 *   <button onClick={() => fetchNextPage()}>
 *     {isFetchingNextPage ? 'Loading...' : 'Load More'}
 *   </button>
 * )}
 * ```
 */
export function usePaginatedProducts(
  options: PaginatedProductsOptions = {},
  queryOptions?: Partial<
    Omit<
      UseInfiniteQueryOptions<ProductsPage, Error, InfiniteData<ProductsPage>>,
      'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
    >
  >
) {
  return useInfiniteQuery<ProductsPage, Error, InfiniteData<ProductsPage>>({
    queryKey: [
      ...queryKeys.products.list({
        category: options.category,
        search: options.search,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
      }),
      'paginated',
      options.pageSize || 12,
    ],
    queryFn: ({ pageParam = 0 }) => fetchProductsPage(pageParam as number, options),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    // Keep previous data while fetching new pages
    placeholderData: (previousData) => previousData,
    // Stale time of 5 minutes
    staleTime: 5 * 60 * 1000,
    // Cache for 10 minutes
    gcTime: 10 * 60 * 1000,
    ...queryOptions,
  });
}

/**
 * Get all products from paginated data
 */
export function getAllProductsFromPages(data: InfiniteData<ProductsPage> | undefined): Product[] {
  if (!data) return [];
  return data.pages.flatMap((page) => page.products);
}

/**
 * Get total count from paginated data
 */
export function getTotalCountFromPages(data: InfiniteData<ProductsPage> | undefined): number {
  if (!data || !data.pages || data.pages.length === 0) return 0;
  // Return the total count from the first page (it's the same for all pages)
  return data.pages[0]?.totalCount || 0;
}
