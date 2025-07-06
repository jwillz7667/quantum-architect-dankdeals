import { ProductCard } from '@/components/ProductCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProducts } from '@/hooks/useProducts';
import { Loader2 } from 'lucide-react';
import { useProductsFilter } from '@/hooks/useProductsFilter';
import blueDreamImg from '@/assets/blue-dream.jpg';
import prerollsImg from '@/assets/prerolls.jpg';
import wellnessImg from '@/assets/wellness.jpg';
import ediblesImg from '@/assets/edibles-hero.jpg';

// Fallback images for different categories
const categoryImages: Record<string, string> = {
  flower: blueDreamImg,
  prerolls: prerollsImg,
  wellness: wellnessImg,
  edibles: ediblesImg,
};

const getImageForProduct = (product: any): string => {
  if (product.image_url) return product.image_url;
  return categoryImages[product.category] || blueDreamImg;
};

const getMinPrice = (variants: any[]): number => {
  if (!variants || variants.length === 0) return 0;
  return Math.min(...variants.map((v) => v.price / 100)); // Convert from cents
};

export function ProductGrid() {
  const { products, loading, error } = useProducts();
  const { searchQuery, selectedCategory } = useProductsFilter();

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
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

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        {searchQuery || selectedCategory ? 'Search Results' : 'Hot right now'}
      </h3>
      {filteredProducts.length === 0 ? (
        <p className="text-muted-foreground">No products found matching your criteria.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={getMinPrice(product.variants)}
              type={product.category}
              image={getImageForProduct(product)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
