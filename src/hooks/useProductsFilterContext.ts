import { createContext, useContext } from 'react';

interface ProductsFilterContextType {
  searchQuery: string;
  selectedCategory: string | null;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  clearFilters: () => void;
}

export const ProductsFilterContext = createContext<ProductsFilterContextType | undefined>(
  undefined
);

export function useProductsFilter() {
  const context = useContext(ProductsFilterContext);
  if (context === undefined) {
    throw new Error('useProductsFilter must be used within a ProductsFilterProvider');
  }
  return context;
}
