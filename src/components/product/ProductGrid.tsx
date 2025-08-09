import { memo, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProductCard, ProductCardSkeleton } from './ProductCard';
import { cn } from '@/lib/utils';
import type { Product } from '@/hooks/useProducts';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  error?: Error | string | null;
  className?: string;
  columns?: {
    mobile?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  maxItems?: number;
  emptyMessage?: string;
  title?: string;
  priorityCount?: number;
}

/**
 * Flexible product grid component
 * - Responsive grid layout
 * - Loading and error states
 * - Configurable columns
 * - Performance optimized
 */
export const ProductGrid = memo(function ProductGrid({
  products,
  loading = false,
  error = null,
  className,
  columns = {
    mobile: 2,
    sm: 3,
    md: 4,
    lg: 5,
    xl: 5,
  },
  maxItems,
  emptyMessage = 'No products available.',
  title,
  priorityCount = 1,
}: ProductGridProps) {
  // Calculate minimum price for products with variants
  const productsWithPrice = useMemo(() => {
    return products.map((product) => {
      const prices = product.variants?.map((v) => v.price) || [];
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;
      return { ...product, minPrice, maxPrice } as Product & {
        minPrice: number;
        maxPrice: number;
      };
    });
  }, [products]);

  // Limit items if maxItems is specified
  const displayProducts = maxItems ? productsWithPrice.slice(0, maxItems) : productsWithPrice;

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

  if (loading) {
    return (
      <div className="space-y-6">
        {title && <h2 className="text-2xl font-semibold">{title}</h2>}
        <div className={gridClasses}>
          {Array.from({ length: maxItems || 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load products. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  if (displayProducts.length === 0) {
    return (
      <Alert>
        <AlertDescription>{emptyMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {title && <h2 className="text-2xl font-semibold">{title}</h2>}
      <div className={gridClasses}>
        {displayProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            minPrice={(product as Product & { minPrice?: number }).minPrice}
            maxPrice={(product as Product & { maxPrice?: number }).maxPrice}
            imageUrl={product.image_url}
            category={product.category}
            thcContent={product.thc_content ?? undefined}
            priority={index < priorityCount}
          />
        ))}
      </div>
    </div>
  );
});

interface FeaturedProductsGridProps {
  className?: string;
}

/**
 * Featured products grid - specialized version of ProductGrid
 */
export function FeaturedProductsGrid({ className }: FeaturedProductsGridProps) {
  const { products, loading, error } = useProducts();

  // Get only featured products
  const featuredProducts = useMemo(() => {
    // For now, take first 4 products as featured since is_featured might not be available
    return products.slice(0, 4);
  }, [products]);

  return (
    <ProductGrid
      products={featuredProducts}
      loading={loading}
      error={error}
      className={className}
      columns={{
        mobile: 2,
        sm: 2,
        md: 4,
        lg: 4,
        xl: 4,
      }}
      title="Featured Products"
      emptyMessage="No featured products available."
      priorityCount={1}
    />
  );
}

interface FilteredProductGridProps {
  searchQuery?: string;
  selectedCategory?: string;
  className?: string;
}

/**
 * Filtered product grid with search and category
 */
export function FilteredProductGrid({
  searchQuery,
  selectedCategory,
  className,
}: FilteredProductGridProps) {
  const { products, loading, error } = useProducts();

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !selectedCategory || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const title = searchQuery || selectedCategory ? 'Search Results' : 'All Products';

  return (
    <ProductGrid
      products={filteredProducts}
      loading={loading}
      error={error}
      className={className}
      title={title}
      emptyMessage="No products found matching your criteria."
    />
  );
}

// Import hook for components that need it
import { useProducts } from '@/hooks/useProducts';
