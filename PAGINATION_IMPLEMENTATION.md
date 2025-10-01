# Product Pagination Implementation Guide

This document describes the pagination implementation for the DankDeals product catalog system.

## Overview

The pagination system has been implemented to prevent performance issues as the product catalog grows. It uses cursor-based pagination with React Query for optimal caching and user experience.

## Key Components

### 1. Core Hooks

#### `usePaginatedProducts` - NEW

Located in `/src/hooks/usePaginatedProducts.tsx`

This is the main hook for paginated product fetching:

```typescript
import {
  usePaginatedProducts,
  getAllProductsFromPages,
  getTotalCountFromPages,
} from '@/hooks/usePaginatedProducts';

const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
  usePaginatedProducts({
    pageSize: 12, // Products per page (default: 12)
    category: 'flower', // Optional category filter
    search: 'runtz', // Optional search term
    sortBy: 'created_at', // Sort field
    sortOrder: 'desc', // Sort direction
  });

// Get all loaded products
const products = getAllProductsFromPages(data);

// Get total count
const totalCount = getTotalCountFromPages(data);
```

#### `useProducts` - UPDATED

Located in `/src/hooks/useProducts.tsx`

The legacy hook maintains backward compatibility with optional pagination:

```typescript
const { products, loading, error, totalCount, hasMore } = useProducts({
  enablePagination: true, // Enable pagination
  pageSize: 20, // Products per page
  page: 0, // Page number
});
```

### 2. UI Components

#### `PaginatedProductGrid` - NEW

Located in `/src/components/product/PaginatedProductGrid.tsx`

Complete product grid with built-in pagination:

```typescript
<PaginatedProductGrid
  searchQuery="flower"
  selectedCategory="indica"
  pageSize={12}
  title="Products"
  emptyMessage="No products found"
/>
```

Features:

- Automatic "Load More" button
- Loading skeletons
- Error handling
- Product count display
- Refetch indicators

#### `FilteredProductGrid` - UPDATED

Located in `/src/components/product/ProductGrid.tsx`

Now supports optional pagination:

```typescript
<FilteredProductGrid
  searchQuery={searchQuery}
  selectedCategory={selectedCategory}
  usePagination={true}    // Enable pagination
  pageSize={12}           // Products per page
/>
```

## Implementation Examples

### Example 1: Categories Page (Already Implemented)

The Categories page now uses pagination by default:

```typescript
// src/pages/Categories.tsx
import { lazy, Suspense } from 'react';

const CategoriesProductGridPaginated = lazy(() =>
  import('@/components/CategoriesProductGridPaginated')
);

export default function Categories() {
  return (
    <Suspense fallback={<ProductSkeletons />}>
      <CategoriesProductGridPaginated />
    </Suspense>
  );
}
```

### Example 2: Enable Pagination in Any Component

To enable pagination in any existing component:

```typescript
// Option 1: Use the ProductGrid wrapper with pagination
import { ProductGrid } from '@/components/ProductGrid';

function MyComponent() {
  return (
    <ProductGrid
      usePagination={true}
      pageSize={20}
    />
  );
}
```

```typescript
// Option 2: Use PaginatedProductGrid directly
import { PaginatedProductGrid } from '@/components/product/PaginatedProductGrid';

function MyComponent() {
  return (
    <PaginatedProductGrid
      searchQuery={search}
      selectedCategory={category}
      pageSize={16}
    />
  );
}
```

### Example 3: Custom Implementation

For custom pagination implementations:

```typescript
import { usePaginatedProducts, getAllProductsFromPages } from '@/hooks/usePaginatedProducts';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';

function CustomProductList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = usePaginatedProducts({
    pageSize: 8,
    category: 'edibles'
  });

  const products = getAllProductsFromPages(data);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>

      {hasNextPage && (
        <Button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </div>
  );
}
```

### Example 4: Infinite Scroll (Future Enhancement)

The infrastructure supports infinite scroll - just add an IntersectionObserver:

```typescript
import { useEffect, useRef } from 'react';
import { usePaginatedProducts } from '@/hooks/usePaginatedProducts';

function InfiniteProductList() {
  const observerRef = useRef<HTMLDivElement>(null);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = usePaginatedProducts({ pageSize: 12 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ... render products ...

  return (
    <>
      {/* Product grid */}
      <div ref={observerRef} />
    </>
  );
}
```

## Performance Benefits

1. **Initial Load**: Only loads 12 products instead of entire catalog
2. **Incremental Loading**: Users load more as needed
3. **Caching**: React Query caches pages for instant navigation
4. **Network Efficiency**: Reduces data transfer and API load
5. **Memory Usage**: Lower memory footprint with smaller datasets

## Database Optimization

The implementation uses Supabase's `.range()` method for efficient pagination:

```sql
-- Efficient query with index on (is_active, created_at)
SELECT * FROM products
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 12 OFFSET 0;
```

## Migration Guide

### For Existing Components

1. **No changes required** - Existing components continue to work
2. **Optional upgrade** - Add `usePagination={true}` to enable
3. **Gradual migration** - Update components as needed

### For New Components

Always use `PaginatedProductGrid` or `usePaginatedProducts` for new features.

## Configuration

### Default Settings

- **Page Size**: 12 products (optimal for most viewports)
- **Sort Order**: Latest products first
- **Cache Time**: 5 minutes stale, 10 minutes garbage collection

### Customization

Adjust settings per component:

```typescript
const SETTINGS = {
  pageSize: 20, // More products per page
  staleTime: 60000, // 1 minute cache
  gcTime: 300000, // 5 minute garbage collection
};
```

## Testing

### Unit Tests

```typescript
// Test pagination hook
it('should load next page when requested', async () => {
  const { result } = renderHook(() => usePaginatedProducts({ pageSize: 5 }));

  await waitFor(() => {
    expect(result.current.data?.pages).toHaveLength(1);
  });

  act(() => {
    result.current.fetchNextPage();
  });

  await waitFor(() => {
    expect(result.current.data?.pages).toHaveLength(2);
  });
});
```

### E2E Tests

```typescript
// Test Load More functionality
test('should load more products on button click', async ({ page }) => {
  await page.goto('/categories');

  const initialProducts = await page.locator('[data-testid="product-card"]').count();
  expect(initialProducts).toBe(12);

  await page.click('button:has-text("Load More")');
  await page.waitForLoadState('networkidle');

  const updatedProducts = await page.locator('[data-testid="product-card"]').count();
  expect(updatedProducts).toBeGreaterThan(12);
});
```

## Monitoring

Track these metrics in production:

1. **Page Load Time**: Time to first product render
2. **Load More Usage**: How many users paginate
3. **Average Pages Loaded**: Typical user behavior
4. **API Response Time**: Pagination query performance

## Future Enhancements

1. **Infinite Scroll**: Auto-load on scroll
2. **Virtual Scrolling**: For extremely large catalogs
3. **Predictive Prefetch**: Preload next page automatically
4. **URL State Sync**: Persist pagination in URL
5. **Advanced Filters**: Multi-faceted search with pagination

## Troubleshooting

### Common Issues

1. **Products not loading**: Check network tab for API errors
2. **Duplicate products**: Ensure unique keys in product rendering
3. **Load More not working**: Verify `hasNextPage` logic
4. **Performance issues**: Check page size and caching settings

### Debug Mode

Enable debug logging:

```typescript
const DEBUG = true;

if (DEBUG) {
  console.log('Pagination state:', {
    totalPages: data?.pages.length,
    totalProducts: getAllProductsFromPages(data).length,
    hasMore: hasNextPage,
  });
}
```

## Admin Dashboard

The admin dashboard already implements pagination:

```typescript
// src/hooks/admin/useAdminProducts.ts
const { data, isLoading } = useAdminProducts({
  page: 1,
  pageSize: 20,
  search: searchTerm,
  status: 'active',
});
```

This uses the same pattern for consistency across the platform.
