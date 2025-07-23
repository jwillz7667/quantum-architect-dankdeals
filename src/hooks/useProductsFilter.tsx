import type { ReactNode } from 'react';
import { useState } from 'react';
import { ProductsFilterContext } from './useProductsFilterContext';
import { sanitizeText } from '@/lib/sanitize';

export function ProductsFilterProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleSetSearchQuery = (query: string) => {
    const sanitizedQuery = sanitizeText(query);
    setSearchQuery(sanitizedQuery);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
  };

  return (
    <ProductsFilterContext.Provider
      value={{
        searchQuery,
        selectedCategory,
        setSearchQuery: handleSetSearchQuery,
        setSelectedCategory,
        clearFilters,
      }}
    >
      {children}
    </ProductsFilterContext.Provider>
  );
}
