import { memo, useMemo } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProducts } from '@/hooks/useProducts';
import { useProductsFilter } from '@/hooks/useProductsFilterContext';
import { ProductGridSkeleton } from '@/components/LoadingStates';

const getMinPrice = (variants: Array<{ price: number }> | undefined): number => {
  if (!variants || variants.length === 0) return 0;
  return Math.min(...variants.map((v) => v.price));
};

export const ProductGrid = memo(function ProductGrid() {
  const { products, loading, error } = useProducts();
  const { searchQuery, selectedCategory } = useProductsFilter();

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description &&
          product.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = !selectedCategory || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  if (loading) {
    return <ProductGridSkeleton count={8} />;
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

  if (filteredProducts.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No products found matching your criteria.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">
        {searchQuery || selectedCategory ? 'Search Results' : 'Featured Products'}
      </h2>

      {/* Simple responsive grid layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            price={getMinPrice(product.variants)}
            category={product.category}
            imageUrl={product.image_url ?? undefined}
            thcContent={product.thc_content ?? undefined}
          />
        ))}
      </div>
    </div>
  );
});
