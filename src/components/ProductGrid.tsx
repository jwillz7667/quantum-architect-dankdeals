// Re-export from the new location
import { useProductsFilter } from '@/hooks/useProductsFilterContext';
import { FilteredProductGrid } from './product/ProductGrid';

interface ProductGridProps {
  usePagination?: boolean;
  pageSize?: number;
}

export const ProductGrid = function ProductGrid({
  usePagination = false,
  pageSize = 12,
}: ProductGridProps = {}) {
  const { searchQuery, selectedCategory } = useProductsFilter();

  return (
    <FilteredProductGrid
      searchQuery={searchQuery}
      selectedCategory={selectedCategory || undefined}
      usePagination={usePagination}
      pageSize={pageSize}
    />
  );
};
