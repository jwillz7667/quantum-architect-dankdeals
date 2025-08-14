/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { withRateLimit, orderRateLimiter } from '@/lib/rateLimiter';
import type { CartItem } from '@/types/cart';

interface CreateOrderData {
  // Customer Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;

  // Delivery Information
  deliveryAddress: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    deliveryInstructions?: string;
  };

  // Order Information
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
}

interface OrderResponse {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
}

export class OrderService {
  // Order numbers are generated server-side by the edge function

  static createOrder = withRateLimit(
    async (...args: unknown[]): Promise<OrderResponse> => {
      const orderData = args[0] as CreateOrderData;
      try {
        // Get current user session (optional)
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          logger.error('Session error during order creation', sessionError);
        }

        const userId = session?.user?.id ?? null;

        // Map client order to edge function schema
        const edgePayload = {
          customer_name: `${orderData.firstName} ${orderData.lastName}`,
          customer_email: orderData.email,
          customer_phone: orderData.phone,
          delivery_first_name: orderData.firstName,
          delivery_last_name: orderData.lastName,
          delivery_address: {
            street: orderData.deliveryAddress.street,
            apartment: orderData.deliveryAddress.apartment ?? '',
            city: orderData.deliveryAddress.city,
            state: orderData.deliveryAddress.state,
            zipcode: orderData.deliveryAddress.zipCode,
            instructions: orderData.deliveryAddress.deliveryInstructions ?? '',
          },
          subtotal: orderData.subtotal,
          delivery_fee: orderData.deliveryFee,
          tax: orderData.taxAmount,
          total: orderData.totalAmount,
          payment_method: orderData.paymentMethod,
          items: orderData.items.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            weight: item.variant?.weight_grams || 3.5,
          })),
          user_id: userId,
        };

        type CreateOrderResponse = {
          success: boolean;
          error?: string;
          order?: {
            id: string;
            order_number: string;
            status: string;
            total: number;
          };
        };

        const { data, error } = await supabase.functions.invoke<CreateOrderResponse>(
          'process-order',
          {
            body: edgePayload,
          }
        );

        if (error) {
          logger.error('Edge function error during order creation', error as Error);
          return { success: false, error: error.message || 'Failed to create order' };
        }

        if (!data?.success || !data?.order) {
          return { success: false, error: data?.error || 'Order creation failed' };
        }

        logger.info('Order created via edge function', {
          context: { orderId: data.order.id, orderNumber: data.order.order_number },
        });

        return {
          success: true,
          orderId: data.order.id,
          orderNumber: data.order.order_number,
        };
      } catch (error) {
        logger.error('Unexpected error during order creation', error as Error);
        return { success: false, error: 'An unexpected error occurred' };
      }
    },
    orderRateLimiter,
    (...args: unknown[]) => `order:${(args[0] as CreateOrderData).email}`
  );

  static async getOrder(orderNumber: string) {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (
            *,
            products (name, category, image_url)
          )
        `
        )
        .eq('order_number', orderNumber)
        .single();

      if (error || !order) {
        logger.error('Failed to fetch order', error || new Error('Order fetch failed'));
        return null;
      }

      return order;
    } catch (error) {
      logger.error('Unexpected error fetching order', error as Error);
      return null;
    }
  }

  static async updateOrderStatus(orderId: string, status: string) {
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);

      if (error) {
        logger.error('Failed to update order status', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Unexpected error updating order status', error as Error);
      return false;
    }
  }
}
