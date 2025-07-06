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
  vendor_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  variants: ProductVariant[];
  vendor: {
    name: string;
    status: string;
  };
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  weight_grams: number;
  inventory_count: number | null;
  is_active: boolean;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('products')
        .select(
          `
          *,
          variants:product_variants(*),
          vendor:vendors(name, status)
        `
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
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
    refetch: fetchProducts,
    filterProducts,
  };
}
