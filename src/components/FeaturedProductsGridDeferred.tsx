import { SimpleProductCard } from '@/components/SimpleProductCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProductsDeferred } from '@/hooks/useProductsDeferred';
import { Loader2 } from '@/lib/icons';
import { Skeleton } from '@/components/ui/skeleton';

export function FeaturedProductsGridDeferred() {
  const { products, loading, error, observerRef, hasLoaded } = useProductsDeferred({
    rootMargin: '200px', // Start loading 200px before the component is visible
    threshold: 0.01,
  });

  // Get featured products (first 4 products for better performance)
  const featuredProducts = products.slice(0, 4);

  // Show skeleton loader before intersection observer triggers
  if (!hasLoaded) {
    return (
      <div ref={observerRef}>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-none w-[140px]">
              <Skeleton className="h-[140px] w-full rounded-lg mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  if (products.length === 0) {
    return (
      <Alert>
        <AlertDescription>No products available at the moment. Check back soon!</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {featuredProducts.map((product) => (
        <SimpleProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          category={product.category}
          imageUrl={product.image_url || undefined}
        />
      ))}
    </div>
  );
}
