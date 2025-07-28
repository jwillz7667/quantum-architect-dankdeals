import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from './useProducts';

// Mock data for when database is unavailable
const MOCK_PRODUCTS: Product[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Pineapple Fruz',
    description:
      'A tropical-flavored hybrid strain with sweet pineapple notes and balanced effects.',
    image_url: '/assets/products/pineapple-fruz/pineapple-fruz-1.webp',
    category: 'Flower',
    thc_content: 22.5,
    cbd_content: 0.8,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    variants: [
      {
        id: 'var-pf-1',
        name: '1/8 oz',
        price: 35.0,
        weight_grams: 3.5,
        inventory_count: 10,
        is_active: true,
      },
      {
        id: 'var-pf-2',
        name: '1/4 oz',
        price: 65.0,
        weight_grams: 7.0,
        inventory_count: 5,
        is_active: true,
      },
    ],
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Rainbow Sherbert #11',
    description: 'A fruity indica-dominant hybrid with colorful buds and sweet berry flavors.',
    image_url: '/assets/products/rs11/rainbow-sherbert11-1.webp',
    category: 'Flower',
    thc_content: 24.8,
    cbd_content: 0.5,
    is_active: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    variants: [
      {
        id: 'var-rs-1',
        name: '1/8 oz',
        price: 40.0,
        weight_grams: 3.5,
        inventory_count: 8,
        is_active: true,
      },
      {
        id: 'var-rs-2',
        name: '1/4 oz',
        price: 75.0,
        weight_grams: 7.0,
        inventory_count: 3,
        is_active: true,
      },
    ],
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Runtz',
    description: 'A popular hybrid strain known for its candy-like flavor and balanced effects.',
    image_url: '/assets/products/runtz/runtz-1.webp',
    category: 'Flower',
    thc_content: 26.2,
    cbd_content: 0.3,
    is_active: true,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    variants: [
      {
        id: 'var-runtz-1',
        name: '1/8 oz',
        price: 45.0,
        weight_grams: 3.5,
        inventory_count: 6,
        is_active: true,
      },
      {
        id: 'var-runtz-2',
        name: '1/4 oz',
        price: 85.0,
        weight_grams: 7.0,
        inventory_count: 2,
        is_active: true,
      },
    ],
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Wedding Cake',
    description:
      'An indica-dominant hybrid with vanilla and earthy flavors, perfect for relaxation.',
    image_url: '/assets/products/wedding-cake/wedding-cake-1.webp',
    category: 'Flower',
    thc_content: 23.7,
    cbd_content: 0.6,
    is_active: true,
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
    variants: [
      {
        id: 'var-wc-1',
        name: '1/8 oz',
        price: 38.0,
        weight_grams: 3.5,
        inventory_count: 12,
        is_active: true,
      },
      {
        id: 'var-wc-2',
        name: '1/4 oz',
        price: 70.0,
        weight_grams: 7.0,
        inventory_count: 7,
        is_active: true,
      },
    ],
  },
];

interface UseProductsDeferredOptions {
  loadImmediately?: boolean;
  rootMargin?: string;
  threshold?: number;
}

export function useProductsDeferred(options: UseProductsDeferredOptions = {}) {
  const { loadImmediately = false, rootMargin = '100px', threshold = 0.1 } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchProducts = async () => {
    if (hasLoaded) return; // Don't fetch if already loaded

    try {
      setLoading(true);
      setError(null);
      setUsingMockData(false);

      const { data, error: fetchError } = await supabase
        .from('products')
        .select(
          `
          *,
          variants:product_variants(*)
        `
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        // Check if it's a permissions error (RLS issue)
        if (
          fetchError.message.includes('permission denied') ||
          fetchError.message.includes('policy') ||
          fetchError.code === 'PGRST116'
        ) {
          console.warn('Database access denied, using mock data:', fetchError.message);
          setProducts(MOCK_PRODUCTS);
          setUsingMockData(true);
          setError('Using demo data - database connection limited');
          setHasLoaded(true);
          return;
        }
        throw fetchError;
      }

      setProducts(data || []);
      setHasLoaded(true);
    } catch (err) {
      console.error('Error fetching products:', err);
      // Fallback to mock data on any error
      console.warn('Falling back to mock data due to error');
      setProducts(MOCK_PRODUCTS);
      setUsingMockData(true);
      setError('Using demo data - connection issue');
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadImmediately) {
      void fetchProducts();
      return;
    }

    // Set up intersection observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            void fetchProducts();
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasLoaded, loadImmediately, rootMargin, threshold]);

  const filterProducts = (searchQuery: string, category: string | null) => {
    if (!searchQuery && !category) return products;

    return products.filter((product) => {
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description &&
          product.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = !category || product.category === category;

      return matchesSearch && matchesCategory;
    });
  };

  return {
    products,
    loading,
    error,
    usingMockData,
    refetch: fetchProducts,
    filterProducts,
    observerRef,
    hasLoaded,
  };
}
