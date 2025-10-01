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
    onSuccess: (_data, variables) => {
      invalidateProducts();
      const productName = variables.product.name;
      const variantCount = variables.variants?.length ?? 0;
      toast.success('✅ Product Updated Successfully', {
        description: `${productName} has been saved with ${variantCount} variant${variantCount !== 1 ? 's' : ''}.`,
        duration: 5000,
      });
    },
    onError: (error) => {
      toast.error('❌ Failed to Save Product', {
        description:
          error instanceof Error ? error.message : 'An unknown error occurred. Please try again.',
        duration: 7000,
      });
    },
  });

  const remove = useMutation({
    mutationKey: ['admin-delete-product'],
    mutationFn: (variables: { id: string; hardDelete?: boolean }) =>
      deleteAdminProduct(variables.id, { hardDelete: variables.hardDelete }),
    onSuccess: (_data, variables) => {
      invalidateProducts();
      const action = variables.hardDelete ? 'permanently deleted' : 'archived';
      toast.success(`✅ Product ${action}`, {
        description: 'The product has been removed from the storefront.',
        duration: 4000,
      });
    },
    onError: (error) => {
      toast.error('❌ Failed to Delete Product', {
        description:
          error instanceof Error ? error.message : 'An unknown error occurred. Please try again.',
        duration: 7000,
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
    onSuccess: (_data, variables) => {
      invalidateProducts();
      const newStatus = !(variables.is_active ?? true);
      const statusText = newStatus ? 'activated' : 'deactivated';
      toast.success(`✅ Product ${statusText}`, {
        description: `${variables.name} is now ${newStatus ? 'visible' : 'hidden'} on the storefront.`,
        duration: 4000,
      });
    },
    onError: (error) => {
      toast.error('❌ Failed to Update Status', {
        description:
          error instanceof Error ? error.message : 'An unknown error occurred. Please try again.',
        duration: 7000,
      });
    },
  });

  return {
    upsert,
    remove,
    toggleStatus,
  };
};
