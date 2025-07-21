import type { ReactNode } from 'react';
import { useState } from 'react';
import { ProductsFilterContext } from './useProductsFilterContext';

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
