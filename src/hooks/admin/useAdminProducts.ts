import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  deleteAdminProduct,
  fetchAdminProductById,
  fetchAdminProducts,
  mapProductRowToUpsertInput,
  type AdminProduct,
  type AdminProductFilters,
  type AdminProductListResponse,
  type UpsertAdminProductInput,
  upsertAdminProduct,
} from '@/lib/admin/products';
import { queryKeys } from '@/lib/react-query/config';

const normalizeFilters = (filters: AdminProductFilters = {}) => ({
  page: filters.page ?? 1,
  pageSize: filters.pageSize ?? 20,
  search: filters.search?.trim() ?? '',
  status: filters.status ?? 'all',
});

export const useAdminProducts = (filters: AdminProductFilters = {}) => {
  const normalized = normalizeFilters(filters);

  return useQuery<AdminProductListResponse>({
    queryKey: queryKeys.admin.products.list(normalized),
    queryFn: () => fetchAdminProducts(normalized),
    placeholderData: keepPreviousData,
  });
};

export const useAdminProduct = (id?: string, enabled: boolean = true) => {
  const shouldFetch = Boolean(id) && enabled;

  return useQuery<AdminProduct | null>({
    queryKey: shouldFetch
      ? queryKeys.admin.products.detail(id as string)
      : queryKeys.admin.products.detail(''),
    queryFn: () => fetchAdminProductById(id as string),
    enabled: shouldFetch,
  });
};

export const useAdminProductMutations = () => {
  const queryClient = useQueryClient();

  const invalidateProducts = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.products.all() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
  };

  const upsert = useMutation({
    mutationKey: ['admin-upsert-product'],
    mutationFn: (input: UpsertAdminProductInput) => upsertAdminProduct(input),
    onSuccess: () => {
      invalidateProducts();
      toast.success('Product saved successfully');
    },
    onError: (error) => {
      toast.error('Unable to save product', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const remove = useMutation({
    mutationKey: ['admin-delete-product'],
    mutationFn: (variables: { id: string; hardDelete?: boolean }) =>
      deleteAdminProduct(variables.id, { hardDelete: variables.hardDelete }),
    onSuccess: () => {
      invalidateProducts();
      toast.success('Product deleted');
    },
    onError: (error) => {
      toast.error('Unable to delete product', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const toggleStatus = useMutation({
    mutationKey: ['admin-toggle-product'],
    mutationFn: (product: AdminProduct) => {
      const payload = mapProductRowToUpsertInput(product);
      return upsertAdminProduct({
        ...payload,
        product: {
          ...payload.product,
          is_active: !(product.is_active ?? true),
        },
      });
    },
    onSuccess: () => {
      invalidateProducts();
      toast.success('Product status updated');
    },
    onError: (error) => {
      toast.error('Unable to update product status', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  return {
    upsert,
    remove,
    toggleStatus,
  };
};
