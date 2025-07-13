import { ProductCard } from '@/components/ProductCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProducts } from '@/hooks/useProducts';
import { Loader2 } from 'lucide-react';
import { useProductsFilter } from '@/hooks/useProductsFilter';
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeGrid as Grid } from "react-window";

function getMinPrice(variants: Array<{ price: number }> | undefined): number {
  if (!variants || variants.length === 0) return 0;
  return Math.min(...variants.map((v) => v.price / 100)); // Convert from cents to dollars
}



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

  if (filteredProducts.length === 0) {
    return <p className="text-muted-foreground">No products found matching your criteria.</p>;
  }
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        {searchQuery || selectedCategory ? 'Search Results' : 'Hot right now'}
      </h3>
      <div style={{ height: '600px' }}>
        <AutoSizer>
          {({ height, width }) => {
            const columnWidth = 200; // Adjust based on your ProductCard width
            const columnCount = Math.max(1, Math.floor(width / columnWidth));
            const rowCount = Math.ceil(filteredProducts.length / columnCount);
            const rowHeight = 300; // Adjust based on your ProductCard height
            return (
              <Grid
                columnCount={columnCount}
                columnWidth={width / columnCount}
                height={height}
                rowCount={rowCount}
                rowHeight={rowHeight}
                width={width}
              >
                {({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
                  const index = rowIndex * columnCount + columnIndex;
                  if (index >= filteredProducts.length) return null;
                  const product = filteredProducts[index];
                  return (
                    <div style={style}>
                      <ProductCard
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        price={getMinPrice(product.variants)}
                        category={product.category}
                        imageUrl={product.image_url}
                        thcContent={product.thc_content}
                        cbdContent={product.cbd_content}
                        description={product.description}
                      />
                    </div>
                  );
                }}
              </Grid>
            );
          }}
        </AutoSizer>
      </div>
    </div>
  );
}
