// Re-export from the new location
import { useProductsFilter } from '@/hooks/useProductsFilterContext';
import { FilteredProductGrid } from './product/ProductGrid';

export const ProductGrid = function ProductGrid() {
  const { searchQuery, selectedCategory } = useProductsFilter();

  return (
    <FilteredProductGrid
      searchQuery={searchQuery}
      selectedCategory={selectedCategory || undefined}
    />
  );
};
