/**
 * Admin Dashboard API
 *
 * TypeScript wrapper for admin dashboard database functions.
 * All functions require admin privileges and will throw if the user is not an admin.
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DashboardMetrics {
  active_products: number;
  low_inventory_products: number;
  pending_orders: number;
  today_orders: number;
  today_revenue: number;
  total_users: number;
  verified_users: number;
  storefront_status: 'healthy' | 'warning' | 'error';
  generated_at: string;
}

export interface LowInventoryProduct {
  product_id: string;
  product_name: string;
  variant_id: string;
  variant_name: string;
  inventory_count: number | null;
  is_active: boolean;
}

export interface OrderListItem {
  order_id: string;
  order_number: string;
  status: string;
  payment_status: string;
  customer_email: string;
  customer_name: string;
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  total_amount: number;
  items_count: number;
  created_at: string;
  updated_at: string;
  delivery_city: string;
  delivery_state: string;
  total_count: number;
}

export interface OrderDetails {
  order: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
  customer: Record<string, unknown> | null;
  status_history: Array<Record<string, unknown>>;
}

export interface UserListItem {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  is_admin: boolean;
  age_verified: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at: string | null;
  total_orders: number;
  total_spent: number;
  total_count: number;
}

export interface UserDetails {
  profile: Record<string, unknown>;
  preferences: Record<string, unknown> | null;
  addresses: Array<Record<string, unknown>>;
  recent_orders: Array<Record<string, unknown>>;
  stats: {
    total_orders: number;
    total_spent: number;
    average_order_value: number;
    last_order_date: string | null;
  };
}

export interface SalesAnalytics {
  period_start: string;
  period_end: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  average_order_value: number;
  unique_customers: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  category: string;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
  avg_price: number;
}

export interface CategoryAnalytics {
  category: string;
  total_products: number;
  active_products: number;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
}

export interface InventoryHistoryItem {
  log_id: string;
  product_id: string;
  product_name: string;
  variant_id: string | null;
  variant_name: string | null;
  action: string;
  quantity_before: number;
  quantity_change: number;
  quantity_after: number;
  reason: string | null;
  changed_by_email: string | null;
  created_at: string;
  total_count: number;
}

export interface SystemSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export interface AdminActionLog {
  log_id: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  total_count: number;
}

export interface InventoryUpdate {
  variant_id: string;
  quantity_change: number;
  reason?: string;
}

// ============================================================================
// API FUNCTIONS - DASHBOARD METRICS
// ============================================================================

/**
 * Get comprehensive dashboard metrics
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const { data, error } = await supabase.rpc('admin_get_dashboard_metrics');

  if (error) {
    throw new Error(`Failed to fetch dashboard metrics: ${error.message}`);
  }

  return data as DashboardMetrics;
}

/**
 * Get products with low inventory
 */
export async function getLowInventoryProducts(
  threshold: number = 10
): Promise<LowInventoryProduct[]> {
  const { data, error } = await supabase.rpc('admin_get_low_inventory_products', {
    threshold,
  });

  if (error) {
    throw new Error(`Failed to fetch low inventory products: ${error.message}`);
  }

  return data as LowInventoryProduct[];
}

// ============================================================================
// API FUNCTIONS - ORDER MANAGEMENT
// ============================================================================

export interface GetOrdersParams {
  page_number?: number;
  page_size?: number;
  status_filter?: string | null;
  payment_status_filter?: string | null;
  search_term?: string | null;
  date_from?: string | null;
  date_to?: string | null;
}

/**
 * Get orders with filters and pagination
 */
export async function getOrders(params: GetOrdersParams = {}): Promise<OrderListItem[]> {
  const { data, error } = await supabase.rpc('admin_get_orders', {
    page_number: params.page_number ?? 1,
    page_size: params.page_size ?? 20,
    status_filter: params.status_filter ?? null,
    payment_status_filter: params.payment_status_filter ?? null,
    search_term: params.search_term ?? null,
    date_from: params.date_from ?? null,
    date_to: params.date_to ?? null,
  });

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  return data as OrderListItem[];
}

/**
 * Get detailed order information
 */
export async function getOrderDetails(orderId: string): Promise<OrderDetails> {
  const { data, error } = await supabase.rpc('admin_get_order_details', {
    order_id_param: orderId,
  });

  if (error) {
    throw new Error(`Failed to fetch order details: ${error.message}`);
  }

  return data as OrderDetails;
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  statusMessage?: string
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc('admin_update_order_status', {
    order_id_param: orderId,
    new_status: newStatus,
    status_message: statusMessage ?? null,
  });

  if (error) {
    throw new Error(`Failed to update order status: ${error.message}`);
  }

  return data as Record<string, unknown>;
}

// ============================================================================
// API FUNCTIONS - USER MANAGEMENT
// ============================================================================

export interface GetUsersParams {
  page_number?: number;
  page_size?: number;
  search_term?: string | null;
  role_filter?: string | null;
  verified_filter?: boolean | null;
}

/**
 * Get users with filters and pagination
 */
export async function getUsers(params: GetUsersParams = {}): Promise<UserListItem[]> {
  const { data, error } = await supabase.rpc('admin_get_users', {
    page_number: params.page_number ?? 1,
    page_size: params.page_size ?? 20,
    search_term: params.search_term ?? null,
    role_filter: params.role_filter ?? null,
    verified_filter: params.verified_filter ?? null,
  });

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return data as UserListItem[];
}

/**
 * Get detailed user information
 */
export async function getUserDetails(userId: string): Promise<UserDetails> {
  const { data, error } = await supabase.rpc('admin_get_user_details', {
    user_id_param: userId,
  });

  if (error) {
    throw new Error(`Failed to fetch user details: ${error.message}`);
  }

  return data as UserDetails;
}

/**
 * Update user role and admin status
 */
export async function updateUserRole(
  userId: string,
  newRole: 'user' | 'admin',
  newIsAdmin?: boolean
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc('admin_update_user_role', {
    user_id_param: userId,
    new_role: newRole,
    new_is_admin: newIsAdmin ?? null,
  });

  if (error) {
    throw new Error(`Failed to update user role: ${error.message}`);
  }

  return data as Record<string, unknown>;
}

// ============================================================================
// API FUNCTIONS - ANALYTICS
// ============================================================================

/**
 * Get sales analytics grouped by time period
 */
export async function getSalesAnalytics(
  startDate?: string,
  endDate?: string,
  groupByPeriod: 'day' | 'week' | 'month' = 'day'
): Promise<SalesAnalytics[]> {
  const { data, error } = await supabase.rpc('admin_get_sales_analytics', {
    start_date: startDate ?? null,
    end_date: endDate ?? null,
    group_by_period: groupByPeriod,
  });

  if (error) {
    throw new Error(`Failed to fetch sales analytics: ${error.message}`);
  }

  return data as SalesAnalytics[];
}

/**
 * Get top-selling products
 */
export async function getTopProducts(
  startDate?: string,
  endDate?: string,
  limitCount: number = 10
): Promise<TopProduct[]> {
  const { data, error } = await supabase.rpc('admin_get_top_products', {
    start_date: startDate ?? null,
    end_date: endDate ?? null,
    limit_count: limitCount,
  });

  if (error) {
    throw new Error(`Failed to fetch top products: ${error.message}`);
  }

  return data as TopProduct[];
}

/**
 * Get category performance analytics
 */
export async function getCategoryAnalytics(
  startDate?: string,
  endDate?: string
): Promise<CategoryAnalytics[]> {
  const { data, error } = await supabase.rpc('admin_get_category_analytics', {
    start_date: startDate ?? null,
    end_date: endDate ?? null,
  });

  if (error) {
    throw new Error(`Failed to fetch category analytics: ${error.message}`);
  }

  return data as CategoryAnalytics[];
}

// ============================================================================
// API FUNCTIONS - INVENTORY MANAGEMENT
// ============================================================================

/**
 * Bulk update inventory for multiple variants
 */
export async function bulkUpdateInventory(
  updates: InventoryUpdate[]
): Promise<{ success: boolean; affected_count: number; updated_at: string }> {
  const { data, error } = await supabase.rpc('admin_bulk_update_inventory', {
    updates: updates,
  });

  if (error) {
    throw new Error(`Failed to update inventory: ${error.message}`);
  }

  return data as { success: boolean; affected_count: number; updated_at: string };
}

export interface GetInventoryHistoryParams {
  product_id_param?: string | null;
  variant_id_param?: string | null;
  action_filter?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  page_number?: number;
  page_size?: number;
}

/**
 * Get inventory change history
 */
export async function getInventoryHistory(
  params: GetInventoryHistoryParams = {}
): Promise<InventoryHistoryItem[]> {
  const { data, error } = await supabase.rpc('admin_get_inventory_history', {
    product_id_param: params.product_id_param ?? null,
    variant_id_param: params.variant_id_param ?? null,
    action_filter: params.action_filter ?? null,
    start_date: params.start_date ?? null,
    end_date: params.end_date ?? null,
    page_number: params.page_number ?? 1,
    page_size: params.page_size ?? 50,
  });

  if (error) {
    throw new Error(`Failed to fetch inventory history: ${error.message}`);
  }

  return data as InventoryHistoryItem[];
}

// ============================================================================
// API FUNCTIONS - SYSTEM SETTINGS
// ============================================================================

/**
 * Get all system configuration settings
 */
export async function getSystemSettings(): Promise<SystemSetting[]> {
  const { data, error } = await supabase.rpc('admin_get_system_settings');

  if (error) {
    throw new Error(`Failed to fetch system settings: ${error.message}`);
  }

  return data as SystemSetting[];
}

/**
 * Update or create a system setting
 */
export async function updateSystemSetting(
  key: string,
  value: string,
  description?: string
): Promise<{ key: string; value: string; updated_at: string }> {
  const { data, error } = await supabase.rpc('admin_update_system_setting', {
    setting_key: key,
    setting_value: value,
    setting_description: description ?? null,
  });

  if (error) {
    throw new Error(`Failed to update system setting: ${error.message}`);
  }

  return data as { key: string; value: string; updated_at: string };
}

// ============================================================================
// API FUNCTIONS - AUDIT LOG
// ============================================================================

export interface GetActionLogsParams {
  action_filter?: string | null;
  resource_type_filter?: string | null;
  user_id_filter?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  page_number?: number;
  page_size?: number;
}

/**
 * Get admin action audit logs
 */
export async function getActionLogs(params: GetActionLogsParams = {}): Promise<AdminActionLog[]> {
  const { data, error } = await supabase.rpc('admin_get_action_logs', {
    action_filter: params.action_filter ?? null,
    resource_type_filter: params.resource_type_filter ?? null,
    user_id_filter: params.user_id_filter ?? null,
    start_date: params.start_date ?? null,
    end_date: params.end_date ?? null,
    page_number: params.page_number ?? 1,
    page_size: params.page_size ?? 50,
  });

  if (error) {
    throw new Error(`Failed to fetch action logs: ${error.message}`);
  }

  return data as AdminActionLog[];
}

// ============================================================================
// API FUNCTIONS - BULK OPERATIONS
// ============================================================================

/**
 * Bulk activate or deactivate products
 */
export async function bulkToggleProducts(
  productIds: string[],
  setActive: boolean
): Promise<{ success: boolean; affected_count: number; set_active: boolean }> {
  const { data, error } = await supabase.rpc('admin_bulk_toggle_products', {
    product_ids: productIds,
    set_active: setActive,
  });

  if (error) {
    throw new Error(`Failed to toggle products: ${error.message}`);
  }

  return data as { success: boolean; affected_count: number; set_active: boolean };
}

/**
 * Bulk update product categories
 */
export async function bulkUpdateCategory(
  productIds: string[],
  newCategory: 'flower' | 'edibles' | 'concentrates' | 'accessories'
): Promise<{ success: boolean; affected_count: number; new_category: string }> {
  const { data, error } = await supabase.rpc('admin_bulk_update_category', {
    product_ids: productIds,
    new_category: newCategory,
  });

  if (error) {
    throw new Error(`Failed to update categories: ${error.message}`);
  }

  return data as { success: boolean; affected_count: number; new_category: string };
}
