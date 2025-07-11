import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

interface ProductsFilterContextType {
  searchQuery: string;
  selectedCategory: string | null;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  clearFilters: () => void;
}

const ProductsFilterContext = createContext<ProductsFilterContextType | undefined>(undefined);

export function ProductsFilterProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
  };

  return (
    <ProductsFilterContext.Provider
      value={{
        searchQuery,
        selectedCategory,
        setSearchQuery,
        setSelectedCategory,
        clearFilters,
      }}
    >
      {children}
    </ProductsFilterContext.Provider>
  );
}

export function useProductsFilter() {
  const context = useContext(ProductsFilterContext);
  if (context === undefined) {
    throw new Error('useProductsFilter must be used within a ProductsFilterProvider');
  }
  return context;
}
