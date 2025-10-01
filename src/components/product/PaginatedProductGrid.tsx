import { memo, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ProductCard, ProductCardSkeleton } from './ProductCard';
import { cn } from '@/lib/utils';
import {
  usePaginatedProducts,
  getAllProductsFromPages,
  getTotalCountFromPages,
} from '@/hooks/usePaginatedProducts';
import type { Product } from '@/hooks/useProducts';
import { Loader2 } from 'lucide-react';

interface PaginatedProductGridProps {
  searchQuery?: string;
  selectedCategory?: string | null;
  className?: string;
  columns?: {
    mobile?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  pageSize?: number;
  title?: string;
  emptyMessage?: string;
  priorityCount?: number;
}

/**
 * Paginated product grid with "Load More" functionality
 * Optimized for performance with large product catalogs
 */
export const PaginatedProductGrid = memo(function PaginatedProductGrid({
  searchQuery,
  selectedCategory,
  className,
  columns = {
    mobile: 2,
    sm: 3,
    md: 4,
    lg: 5,
    xl: 5,
  },
  pageSize = 12,
  title,
  emptyMessage = 'No products available.',
  priorityCount = 4,
}: PaginatedProductGridProps) {
  // Use the paginated products hook
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    isRefetching,
  } = usePaginatedProducts({
    pageSize,
    category: selectedCategory,
    search: searchQuery,
  });

  // Get all products from paginated data
  const allProducts = useMemo(() => getAllProductsFromPages(data), [data]);
  const totalCount = useMemo(() => getTotalCountFromPages(data), [data]);

  // Calculate minimum price for products with variants
  const productsWithPrice = useMemo(() => {
    return allProducts.map((product) => {
      const prices = product.variants?.map((v) => v.price) || [];
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;
      return { ...product, minPrice, maxPrice } as Product & {
        minPrice: number;
        maxPrice: number;
      };
    });
  }, [allProducts]);

  // Generate grid classes
  const gridClasses = cn(
    'grid gap-4 md:gap-6',
    {
      [`grid-cols-${columns.mobile || 2}`]: true,
      [`sm:grid-cols-${columns.sm || 3}`]: true,
      [`md:grid-cols-${columns.md || 4}`]: true,
      [`lg:grid-cols-${columns.lg || 5}`]: true,
      [`xl:grid-cols-${columns.xl || 5}`]: true,
    },
    className
  );

  // Setup infinite scroll if enabled
  // (Implementation would go here with IntersectionObserver)

  // Initial loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {title && <h2 className="text-2xl font-semibold">{title}</h2>}
        <div className={gridClasses}>
          {Array.from({ length: pageSize }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error
            ? error.message
            : 'Failed to load products. Please try again later.'}
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (productsWithPrice.length === 0) {
    return (
      <Alert>
        <AlertDescription>{emptyMessage}</AlertDescription>
      </Alert>
    );
  }

  // Render products with Load More
  return (
    <div className="space-y-8">
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{title}</h2>
          {totalCount > 0 && (
            <span className="text-sm text-muted-foreground">
              Showing {productsWithPrice.length} of {totalCount} products
            </span>
          )}
        </div>
      )}

      <div className={gridClasses}>
        {productsWithPrice.map((product, index) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            minPrice={product.minPrice}
            maxPrice={product.maxPrice}
            imageUrl={product.image_url}
            category={product.category}
            thcContent={product.thc_content ?? undefined}
            priority={index < priorityCount}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="min-w-[200px]"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading more...
              </>
            ) : (
              'Load More Products'
            )}
          </Button>
        </div>
      )}

      {/* Refetching indicator */}
      {isRefetching && !isFetchingNextPage && (
        <div className="fixed bottom-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-3 flex items-center gap-2 z-40">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Updating products...</span>
        </div>
      )}
    </div>
  );
});

interface FeaturedPaginatedProductsGridProps {
  className?: string;
}

/**
 * Featured products grid with pagination
 */
export function FeaturedPaginatedProductsGrid({ className }: FeaturedPaginatedProductsGridProps) {
  // For featured products, we might want to filter by a "is_featured" field
  // For now, just show the first page of products
  const { data, isLoading, isError, error } = usePaginatedProducts({
    pageSize: 4, // Only show 4 featured products
  });

  const featuredProducts = useMemo(() => {
    const products = getAllProductsFromPages(data);
    return products.slice(0, 4); // Take first 4 as featured
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Featured Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load featured products.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (featuredProducts.length === 0) {
    return null; // Don't show section if no products
  }

  // Calculate prices for featured products
  const productsWithPrice = featuredProducts.map((product) => {
    const prices = product.variants?.map((v) => v.price) || [];
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    return { ...product, minPrice, maxPrice };
  });

  return (
    <div className={cn('space-y-6', className)}>
      <h2 className="text-2xl font-semibold">Featured Products</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {productsWithPrice.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            minPrice={product.minPrice}
            maxPrice={product.maxPrice}
            imageUrl={product.image_url}
            category={product.category}
            thcContent={product.thc_content ?? undefined}
            priority={true}
          />
        ))}
      </div>
    </div>
  );
}
