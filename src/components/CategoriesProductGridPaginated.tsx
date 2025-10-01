import { useProductsFilter } from '@/hooks/useProductsFilterContext';
import { PaginatedProductGrid } from './product/PaginatedProductGrid';

/**
 * Product grid for the Categories page with pagination
 * Uses the global products filter context
 */
export function CategoriesProductGridPaginated() {
  const { searchQuery, selectedCategory } = useProductsFilter();

  return (
    <PaginatedProductGrid
      searchQuery={searchQuery}
      selectedCategory={selectedCategory}
      pageSize={12}
      title={searchQuery || selectedCategory ? undefined : 'All Products'}
      emptyMessage="No products found matching your criteria. Try adjusting your filters."
      priorityCount={4}
    />
  );
}
