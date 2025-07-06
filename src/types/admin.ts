// src/types/admin.ts

import type { User } from '@supabase/supabase-js';

// Database Types
export interface StoreSettings {
  id: string;
  storeName: string;
  storeEmail: string;
  storePhone?: string;
  storeAddress?: string;
  businessHours: BusinessHours;
  timezone: string;
  currency: string;
  orderMinimum: number;
  deliveryFee: number;
  taxRate: number;
  maxDeliveryRadius: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessHours {
  [day: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
}

export interface DeliveryZone {
  id: string;
  zipCode: string;
  city: string;
  state: string;
  isActive: boolean;
  deliveryFee?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettings {
  id: string;
  adminId: string;
  emailNewOrder: boolean;
  emailOrderCanceled: boolean;
  emailLowInventory: boolean;
  emailNewUser: boolean;
  smsNewOrder: boolean;
  smsOrderCanceled: boolean;
  lowInventoryThreshold: number;
  soundEnabled: boolean;
  desktopNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecuritySettings {
  id: string;
  twoFactorRequired: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  maxLoginAttempts: number;
  ipWhitelist: string[];
  auditLogRetention: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminActivityLog {
  id: string;
  adminId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

export interface ProductMetric {
  id: string;
  productId: string;
  date: Date;
  views: number;
  cartAdditions: number;
  purchases: number;
  revenue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMetric {
  id: string;
  userId: string;
  date: Date;
  loginCount: number;
  pageViews: number;
  ordersPlaced: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledReport {
  id: string;
  reportType: string;
  schedule: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  config: Record<string, unknown>;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportHistory {
  id: string;
  reportType: string;
  dateRange: {
    from: Date;
    to: Date;
  };
  generatedBy: string;
  fileUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Component Types
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  activeProducts: number;
  lowStockProducts: number;
  pendingOrders: number;
  completedOrders: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  totalRevenue: number;
  totalQuantity: number;
  orderCount: number;
}

export interface OrderStatus {
  pending: number;
  confirmed: number;
  preparing: number;
  ready: number;
  delivered: number;
  cancelled: number;
}

export interface AdminNotification {
  id: string;
  type: 'order' | 'inventory' | 'user' | 'system' | 'payment';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  metadata?: {
    orderId?: string;
    productId?: string;
    userId?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    actionUrl?: string;
  };
}

// API Response Types
export interface DashboardResponse {
  stats: DashboardStats;
  revenueChart: RevenueChartData[];
  topProducts: TopProduct[];
  recentOrders: Order[];
  orderStatus: OrderStatus;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  status: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  totalAmount: number;
  deliveryAddress?: string;
  deliveryNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  orderItems: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productVariantId: string;
  productVariant?: {
    sku: string;
    size: string;
    product: {
      name: string;
      category: string;
    };
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Filter Types
export interface OrderFilters {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  customerId?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface ProductFilters {
  category?: string;
  isActive?: boolean;
  lowStock?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface UserFilters {
  role?: string;
  isVerified?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Report Types
export type ReportType = 
  | 'sales-summary'
  | 'order-details'
  | 'product-performance'
  | 'inventory-status'
  | 'customer-activity'
  | 'financial-summary';

export interface ReportConfig {
  id: ReportType;
  name: string;
  description: string;
  category: 'sales' | 'inventory' | 'users' | 'financial';
  parameters?: ReportParameter[];
}

export interface ReportParameter {
  name: string;
  type: 'date' | 'date-range' | 'select' | 'number' | 'text';
  label: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: unknown;
}

export interface AdminUser extends User {
  role: 'admin' | 'super_admin';
  permissions?: string[];
  firstName?: string;
  lastName?: string;
  displayName?: string;
} 