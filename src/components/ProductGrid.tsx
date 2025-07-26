import { memo, useMemo } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/hooks/useProducts';
import { useProductsFilter } from '@/hooks/useProductsFilterContext';
import { ProductGridSkeleton } from '@/components/LoadingStates';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid as Grid, type GridChildComponentProps } from 'react-window';

const getMinPrice = (variants: Array<{ price: number }> | undefined): number => {
  if (!variants || variants.length === 0) return 0;
  return Math.min(...variants.map((v) => v.price)); // Price is already in dollars
};

// Memoized grid cell component
interface GridItemData {
  filteredProducts: Product[];
  columnCount: number;
}

const GridCell = memo(function GridCell({
  columnIndex,
  rowIndex,
  style,
  data,
}: GridChildComponentProps<GridItemData>) {
  const { filteredProducts, columnCount } = data;
  const index = rowIndex * columnCount + columnIndex;

  if (index >= filteredProducts.length) return null;

  const product = filteredProducts[index];
  if (!product) return null;

  return (
    <div style={style}>
      <ProductCard
        key={product.id}
        id={product.id}
        name={product.name}
        price={getMinPrice(product.variants)}
        category={product.category}
        imageUrl={product.image_url ?? undefined}
        thcContent={product.thc_content ?? undefined}
        cbdContent={product.cbd_content ?? undefined}
        description={product.description ?? undefined}
      />
    </div>
  );
});

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
    return <p className="text-muted-foreground">No products found matching your criteria.</p>;
  }
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        {searchQuery || selectedCategory ? 'Search Results' : 'Hot right now'}
      </h3>
      <div style={{ height: '600px' }}>
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => {
            const columnWidth = 200; // Adjust based on your ProductCard width
            const columnCount = Math.max(1, Math.floor(width / columnWidth));
            const rowCount = Math.ceil(filteredProducts.length / columnCount);
            const rowHeight = 300; // Adjust based on your ProductCard height

            // Create grid item data directly without useMemo in callback
            const itemData = { filteredProducts, columnCount };

            return (
              <Grid
                columnCount={columnCount}
                columnWidth={width / columnCount}
                height={height}
                rowCount={rowCount}
                rowHeight={rowHeight}
                width={width}
                itemData={itemData}
              >
                {GridCell}
              </Grid>
            );
          }}
        </AutoSizer>
      </div>
    </div>
  );
});
