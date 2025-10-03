/**
 * Order history hooks
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrderItem {
  id: string;
  product_id: string | null;
  product_variant_id?: string | null;
  product_name: string;
  product_description: string | null;
  product_category: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_weight_grams: number | null;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  total_amount: number;
  delivery_first_name: string;
  delivery_last_name: string;
  delivery_street_address: string;
  delivery_apartment: string | null;
  delivery_city: string;
  delivery_state: string;
  delivery_zip_code: string;
  delivery_phone: string | null;
  delivery_instructions: string | null;
  payment_method: 'cash' | 'card' | 'other';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  customer_email: string | null;
  customer_phone_number: string | null;
  order_items?: OrderItem[];
}

/**
 * Fetch all orders for current user
 */
export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (
            *
          )
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Fetch a single order by ID
 */
export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (
            *
          )
        `
        )
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as Order;
    },
    enabled: !!orderId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get order status display information
 */
export function getOrderStatusInfo(status: Order['status']): {
  label: string;
  color: string;
  description: string;
} {
  switch (status) {
    case 'pending':
      return {
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        description: 'Order received and awaiting confirmation',
      };
    case 'confirmed':
      return {
        label: 'Confirmed',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        description: 'Order confirmed and being prepared',
      };
    case 'processing':
      return {
        label: 'Processing',
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        description: 'Order is being prepared for delivery',
      };
    case 'out_for_delivery':
      return {
        label: 'Out for Delivery',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        description: 'Order is on the way',
      };
    case 'delivered':
      return {
        label: 'Delivered',
        color: 'bg-green-100 text-green-800 border-green-300',
        description: 'Order has been delivered',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        color: 'bg-red-100 text-red-800 border-red-300',
        description: 'Order was cancelled',
      };
    default:
      return {
        label: status,
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        description: 'Unknown status',
      };
  }
}

/**
 * Format order date for display
 */
export function formatOrderDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format order time for display
 */
export function formatOrderTime(date: string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
