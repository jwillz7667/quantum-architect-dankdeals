import { ProductCard } from '@/components/ProductCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProducts } from '@/hooks/useProducts';
import { Loader2 } from '@/lib/icons';

export function FeaturedProductsGrid() {
  const { products, loading, error } = useProducts();

  // Get featured products (first 4 products for better performance)
  const featuredProducts = products.slice(0, 4);

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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {featuredProducts.map((product) => {
        const minPrice =
          product.variants && product.variants.length > 0
            ? Math.min(...product.variants.map((v) => v.price))
            : 0;

        return (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            price={minPrice}
            category={product.category}
            imageUrl={product.image_url || undefined}
            thcContent={product.thc_content ?? undefined}
          />
        );
      })}
    </div>
  );
}
