import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type AdminProductRow = Tables<'products'>;
export type AdminProductVariantRow = Tables<'product_variants'>;

export interface AdminProduct extends AdminProductRow {
  variants: AdminProductVariantRow[];
}

export type AdminProductStatusFilter = 'all' | 'active' | 'inactive';

export interface AdminProductFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: AdminProductStatusFilter;
}

export interface AdminProductListResponse {
  products: AdminProduct[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UpsertAdminProductInput {
  product: Partial<AdminProductRow> & Pick<AdminProductRow, 'name' | 'category' | 'price'>;
  variants?: Array<
    Partial<AdminProductVariantRow> & Pick<AdminProductVariantRow, 'name' | 'price'>
  >;
  replaceVariants?: boolean;
}

const stripUndefined = <T extends Record<string, unknown>>(value: T): T => {
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries) as T;
};

const sanitizeProduct = (product: UpsertAdminProductInput['product']): Json => {
  const sanitized = stripUndefined(product);

  if (sanitized.effects === undefined && 'effects' in product) {
    sanitized.effects = null;
  }
  if (sanitized.flavors === undefined && 'flavors' in product) {
    sanitized.flavors = null;
  }

  return sanitized as Json;
};

const sanitizeVariant = (
  variant: Partial<AdminProductVariantRow> & Pick<AdminProductVariantRow, 'name' | 'price'>
): Json => stripUndefined(variant) as Json;

export async function fetchAdminProducts(
  filters: AdminProductFilters = {}
): Promise<AdminProductListResponse> {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('products')
    .select('*, variants:product_variants(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.search && filters.search.trim().length > 0) {
    const term = `%${filters.search.trim()}%`;
    query = query.ilike('name', term);
  }

  if (filters.status === 'active') {
    query = query.eq('is_active', true);
  } else if (filters.status === 'inactive') {
    query = query.eq('is_active', false);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    products: (data ?? []) as AdminProduct[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function fetchAdminProductById(id: string): Promise<AdminProduct | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, variants:product_variants(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as AdminProduct | null) ?? null;
}

export async function upsertAdminProduct({
  product,
  variants = [],
  replaceVariants = true,
}: UpsertAdminProductInput) {
  const payload = sanitizeProduct(product);
  const variantPayload = variants.map((variant) => sanitizeVariant(variant));

  const { data, error } = await supabase.rpc('admin_upsert_product', {
    product_data: payload,
    variant_data: variantPayload,
    replace_variants: replaceVariants,
  });

  if (error) {
    console.error('Admin product upsert failed:', {
      error,
      payload: { product: payload, variants: variantPayload },
      message: error.message,
      code: error.code,
      details: error.details,
    });
    throw new Error(
      `Failed to save product: ${error.message}${error.details ? ` - ${error.details}` : ''}`
    );
  }

  return data;
}

export async function deleteAdminProduct(id: string, options: { hardDelete?: boolean } = {}) {
  const { error } = await supabase.rpc('admin_delete_product', {
    target_product_id: id,
    hard_delete: options.hardDelete ?? false,
  });

  if (error) {
    throw error;
  }
}

export const mapProductRowToUpsertInput = (product: AdminProduct): UpsertAdminProductInput => ({
  product: {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    image_url: product.image_url,
    gallery_urls: product.gallery_urls ?? [],
    thc_content: product.thc_content,
    cbd_content: product.cbd_content,
    strain_type: product.strain_type,
    effects: product.effects,
    flavors: product.flavors,
    is_active: product.is_active ?? true,
    is_featured: product.is_featured ?? false,
    stock_quantity: product.stock_quantity,
    weight_grams: product.weight_grams,
    lab_tested: product.lab_tested,
    lab_results_url: product.lab_results_url,
  },
  variants: (product.variants ?? []).map((variant) => ({
    id: variant.id,
    name: variant.name,
    price: variant.price,
    weight_grams: variant.weight_grams,
    inventory_count: variant.inventory_count,
    is_active: variant.is_active ?? true,
  })),
  replaceVariants: true,
});
