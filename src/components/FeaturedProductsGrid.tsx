import { SimpleProductCard } from '@/components/SimpleProductCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProducts } from '@/hooks/useProducts';
import { Loader2 } from 'lucide-react';

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
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {featuredProducts.map((product) => (
        <SimpleProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          category={product.category}
          imageUrl={product.image_url}
        />
      ))}
    </div>
  );
}
