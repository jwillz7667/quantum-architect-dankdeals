import { ProductCard } from "./ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { useProductsFilter } from "@/hooks/useProductsFilter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import blueDreamImg from "@/assets/blue-dream.jpg";
import prerollsImg from "@/assets/prerolls.jpg";
import wellnessImg from "@/assets/wellness.jpg";
import ediblesImg from "@/assets/edibles-hero.jpg";

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
  return Math.min(...variants.map(v => v.price / 100)); // Convert from cents
};

export function ProductGrid() {
  const { products, loading, error } = useProducts();
  const { searchQuery, selectedCategory } = useProductsFilter();

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground">Hot right now</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground">Products</h3>
        <p className="text-muted-foreground">Failed to load products. Please try again later.</p>
      </div>
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