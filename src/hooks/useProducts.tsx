import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string;
  thc_content: number | null;
  cbd_content: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  variants: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  weight_grams: number;
  inventory_count: number | null;
  is_active: boolean;
}

// Mock data for when database is unavailable
const MOCK_PRODUCTS: Product[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Pineapple Fruz',
    description:
      'A tropical-flavored hybrid strain with sweet pineapple notes and balanced effects.',
    image_url:
      'https://ralbzuvkyexortqngvxs.supabase.co/storage/v1/object/public/products/11111111-1111-1111-1111-111111111111/pineapple-fruz-1.webp',
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
    image_url:
      'https://ralbzuvkyexortqngvxs.supabase.co/storage/v1/object/public/products/22222222-2222-2222-2222-222222222222/rainbow-sherbert11-1.webp',
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
    image_url:
      'https://ralbzuvkyexortqngvxs.supabase.co/storage/v1/object/public/products/33333333-3333-3333-3333-333333333333/runtz-1.webp',
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
    image_url:
      'https://ralbzuvkyexortqngvxs.supabase.co/storage/v1/object/public/products/44444444-4444-4444-4444-444444444444/wedding-cake-1.webp',
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

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const fetchProducts = async () => {
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
          return;
        }
        throw fetchError;
      }

      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      // Fallback to mock data on any error
      console.warn('Falling back to mock data due to error');
      setProducts(MOCK_PRODUCTS);
      setUsingMockData(true);
      setError('Using demo data - connection issue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProducts();
  }, []);

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
  };
}
