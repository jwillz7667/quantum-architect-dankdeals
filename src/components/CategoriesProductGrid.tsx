import { ProductCard } from '@/components/ProductCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/hooks/useProducts';
import { Loader2 } from 'lucide-react';
import { useProductsFilter } from '@/hooks/useProductsFilterContext';

export function CategoriesProductGrid() {
  const { products, loading, error } = useProducts();
  const { searchQuery, selectedCategory } = useProductsFilter();

  // Filter products based on search and category
  const filteredProducts: Product[] = products.filter((product) => {
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description &&
        product.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = !selectedCategory || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No products found matching your criteria.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your search or category filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-foreground">
          {searchQuery || selectedCategory ? 'Products' : 'All Products'}
        </h3>
        <span className="text-sm text-muted-foreground">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          // Get the lowest price from available variants
          const basePrice =
            product.variants && product.variants.length > 0
              ? Math.min(...product.variants.filter((v) => v.is_active).map((v) => v.price))
              : 25; // fallback price

          return (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={basePrice}
              category={product.category}
              imageUrl={product.image_url || undefined}
              thcContent={product.thc_content || undefined}
              cbdContent={product.cbd_content || undefined}
              description={product.description ?? undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
