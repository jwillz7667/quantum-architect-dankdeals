/**
 * React Query hooks for Admin Dashboard
 *
 * Provides hooks for fetching and mutating admin dashboard data.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  bulkToggleProducts,
  bulkUpdateCategory,
  bulkUpdateInventory,
  getActionLogs,
  getCategoryAnalytics,
  getDashboardMetrics,
  getInventoryHistory,
  getLowInventoryProducts,
  getOrderDetails,
  getOrders,
  getSalesAnalytics,
  getSystemSettings,
  getTopProducts,
  getUserDetails,
  getUsers,
  updateOrderStatus,
  updateSystemSetting,
  updateUserRole,
  type GetActionLogsParams,
  type GetInventoryHistoryParams,
  type GetOrdersParams,
  type GetUsersParams,
  type InventoryUpdate,
} from '@/lib/admin/dashboard-api';
import { queryKeys } from '@/lib/react-query/config';

// ============================================================================
// DASHBOARD METRICS HOOKS
// ============================================================================

/**
 * Hook to fetch dashboard metrics
 */
export function useAdminDashboardMetrics() {
  return useQuery({
    queryKey: queryKeys.admin.dashboard.metrics(),
    queryFn: getDashboardMetrics,
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Hook to fetch low inventory products
 */
export function useAdminLowInventory(threshold: number = 10) {
  return useQuery({
    queryKey: queryKeys.admin.dashboard.lowInventory(threshold),
    queryFn: () => getLowInventoryProducts(threshold),
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

// ============================================================================
// ORDER MANAGEMENT HOOKS
// ============================================================================

/**
 * Hook to fetch orders with filters
 */
export function useAdminOrders(params: GetOrdersParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.orders.list(params),
    queryFn: () => getOrders(params),
  });
}

/**
 * Hook to fetch order details
 */
export function useAdminOrderDetails(orderId?: string) {
  return useQuery({
    queryKey: orderId ? queryKeys.admin.orders.detail(orderId) : ['admin-order-detail-disabled'],
    queryFn: () => getOrderDetails(orderId!),
    enabled: Boolean(orderId),
  });
}

/**
 * Hook to update order status
 */
export function useAdminUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      newStatus,
      statusMessage,
    }: {
      orderId: string;
      newStatus: string;
      statusMessage?: string;
    }) => updateOrderStatus(orderId, newStatus, statusMessage),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard.all() });
      toast.success('Order status updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update order status', {
        description: error.message,
      });
    },
  });
}

// ============================================================================
// USER MANAGEMENT HOOKS
// ============================================================================

/**
 * Hook to fetch users with filters
 */
export function useAdminUsers(params: GetUsersParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.users.list(params),
    queryFn: () => getUsers(params),
  });
}

/**
 * Hook to fetch user details
 */
export function useAdminUserDetails(userId?: string) {
  return useQuery({
    queryKey: userId ? queryKeys.admin.users.detail(userId) : ['admin-user-detail-disabled'],
    queryFn: () => getUserDetails(userId!),
    enabled: Boolean(userId),
  });
}

/**
 * Hook to update user role
 */
export function useAdminUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      newRole,
      newIsAdmin,
    }: {
      userId: string;
      newRole: 'user' | 'admin';
      newIsAdmin?: boolean;
    }) => updateUserRole(userId, newRole, newIsAdmin),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all() });
      toast.success('User role updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update user role', {
        description: error.message,
      });
    },
  });
}

// ============================================================================
// ANALYTICS HOOKS
// ============================================================================

/**
 * Hook to fetch sales analytics
 */
export function useAdminSalesAnalytics(
  startDate?: string,
  endDate?: string,
  groupByPeriod: 'day' | 'week' | 'month' = 'day'
) {
  return useQuery({
    queryKey: queryKeys.admin.analytics.sales(startDate, endDate, groupByPeriod),
    queryFn: () => getSalesAnalytics(startDate, endDate, groupByPeriod),
  });
}

/**
 * Hook to fetch top products
 */
export function useAdminTopProducts(startDate?: string, endDate?: string, limitCount: number = 10) {
  return useQuery({
    queryKey: queryKeys.admin.analytics.topProducts(startDate, endDate, limitCount),
    queryFn: () => getTopProducts(startDate, endDate, limitCount),
  });
}

/**
 * Hook to fetch category analytics
 */
export function useAdminCategoryAnalytics(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.admin.analytics.categories(startDate, endDate),
    queryFn: () => getCategoryAnalytics(startDate, endDate),
  });
}

// ============================================================================
// INVENTORY MANAGEMENT HOOKS
// ============================================================================

/**
 * Hook to fetch inventory history
 */
export function useAdminInventoryHistory(params: GetInventoryHistoryParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.inventory.history(params),
    queryFn: () => getInventoryHistory(params),
  });
}

/**
 * Hook to bulk update inventory
 */
export function useAdminBulkUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: InventoryUpdate[]) => bulkUpdateInventory(updates),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.inventory.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.products.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard.all() });
      toast.success('Inventory updated successfully', {
        description: `${data.affected_count} variant(s) updated`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to update inventory', {
        description: error.message,
      });
    },
  });
}

// ============================================================================
// SYSTEM SETTINGS HOOKS
// ============================================================================

/**
 * Hook to fetch system settings
 */
export function useAdminSystemSettings() {
  return useQuery({
    queryKey: queryKeys.admin.settings.all(),
    queryFn: getSystemSettings,
  });
}

/**
 * Hook to update system setting
 */
export function useAdminUpdateSystemSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      key,
      value,
      description,
    }: {
      key: string;
      value: string;
      description?: string;
    }) => updateSystemSetting(key, value, description),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.settings.all() });
      toast.success('System setting updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update system setting', {
        description: error.message,
      });
    },
  });
}

// ============================================================================
// AUDIT LOG HOOKS
// ============================================================================

/**
 * Hook to fetch admin action logs
 */
export function useAdminActionLogs(params: GetActionLogsParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.logs.actions(params),
    queryFn: () => getActionLogs(params),
  });
}

// ============================================================================
// BULK OPERATIONS HOOKS
// ============================================================================

/**
 * Hook to bulk toggle product active status
 */
export function useAdminBulkToggleProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productIds, setActive }: { productIds: string[]; setActive: boolean }) =>
      bulkToggleProducts(productIds, setActive),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.products.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard.all() });
      toast.success('Products updated successfully', {
        description: `${data.affected_count} product(s) ${data.set_active ? 'activated' : 'deactivated'}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to update products', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to bulk update product categories
 */
export function useAdminBulkUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productIds,
      newCategory,
    }: {
      productIds: string[];
      newCategory: 'flower' | 'edibles' | 'concentrates' | 'accessories';
    }) => bulkUpdateCategory(productIds, newCategory),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.products.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
      toast.success('Categories updated successfully', {
        description: `${data.affected_count} product(s) moved to ${data.new_category}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to update categories', {
        description: error.message,
      });
    },
  });
}
