// Shared types for order processing system

export interface DeliveryAddress {
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipcode: string;
  instructions?: string;
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  name: string;
  weight?: number;
}

export interface CreateOrderRequest {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_first_name: string;
  delivery_last_name: string;
  delivery_address: DeliveryAddress;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total: number;
  payment_method: string;
  items: OrderItem[];
  user_id?: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string | null;
  status: OrderStatus;
  customer_email: string;
  customer_phone_number: string;
  delivery_first_name: string;
  delivery_last_name: string;
  delivery_street_address: string;
  delivery_apartment?: string | null;
  delivery_city: string;
  delivery_state: string;
  delivery_zip_code: string;
  delivery_instructions?: string | null;
  delivery_phone?: string;
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  total_amount: number;
  payment_method: string;
  payment_status: PaymentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemRecord[];
  profiles?: UserProfile | null;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  product_price: number;
  product_weight_grams: number;
  product_description?: string | null;
  product_category?: string | null;
  product_strain_type?: string | null;
  product_thc_percentage?: number | null;
  product_cbd_percentage?: number | null;
  created_at: string;
  products?: Product;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  strain_type?: string;
  thc_content?: number;
  cbd_content?: number;
  price: number;
  stock_quantity?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// Email Queue Types
export interface EmailJob {
  id?: string;
  type: EmailType;
  to: string;
  subject: string;
  data: Record<string, unknown>;
  priority: 'low' | 'normal' | 'high';
  attempts?: number;
  status?: EmailStatus;
  scheduled_at?: string;
  last_attempt_at?: string;
  completed_at?: string;
  error?: string;
}

export type EmailType = 'ORDER_CONFIRMATION' | 'ORDER_UPDATE' | 'ADMIN_NOTIFICATION';
export type EmailStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Processing Results
export interface OrderResult {
  success: boolean;
  order?: Order;
  error?: string;
  correlationId: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Hook Interfaces
export interface OrderHooks {
  onSuccess?: (order: Order) => Promise<void>;
  onFailure?: (error: Error) => Promise<void>;
}

// Error Types
export class OrderProcessingError extends Error {
  override cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'OrderProcessingError';
    this.cause = cause;
  }
}

export class InsufficientStockError extends Error {
  constructor(public productId: string) {
    super(`Insufficient stock for product ${productId}`);
    this.name = 'InsufficientStockError';
  }
}

export class EmailSendError extends Error {
  constructor(
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'EmailSendError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
