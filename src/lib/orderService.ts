/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { EmailService } from '@/lib/emailService';
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
  private static generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${dateStr}-${timeStr}${random}`;
  }

  static async createOrder(orderData: CreateOrderData): Promise<OrderResponse> {
    try {
      // Get current user session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        logger.error('Session error during order creation', sessionError);
        return { success: false, error: 'Authentication error' };
      }

      let userId: string | null = null;

      // If user is logged in, use their ID
      if (session?.user) {
        userId = session.user.id;

        // Update user profile with order information
        await supabase.from('profiles').upsert({
          id: session.user.id,
          email: orderData.email,
          first_name: orderData.firstName,
          last_name: orderData.lastName,
          phone: orderData.phone,
          date_of_birth: orderData.dateOfBirth,
          updated_at: new Date().toISOString(),
        });
      } else {
        // For guest checkout, create anonymous order without user account
        // We'll store guest info directly in the order record
        userId = null;
      }

      // Generate order number
      const orderNumber = this.generateOrderNumber();

      // Create the order - userId can be null for guest orders
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId, // Can be null for guest orders
          order_number: orderNumber,
          status: 'pending',
          subtotal: orderData.subtotal,
          tax_amount: orderData.taxAmount,
          delivery_fee: orderData.deliveryFee,
          total_amount: orderData.totalAmount,
          delivery_first_name: orderData.firstName,
          delivery_last_name: orderData.lastName,
          delivery_street_address: orderData.deliveryAddress.street,
          delivery_apartment: orderData.deliveryAddress.apartment,
          delivery_city: orderData.deliveryAddress.city,
          delivery_state: orderData.deliveryAddress.state,
          delivery_zip_code: orderData.deliveryAddress.zipCode,
          delivery_phone: orderData.phone,
          delivery_instructions: orderData.deliveryAddress.deliveryInstructions,
          payment_method: orderData.paymentMethod,
          payment_status: 'pending',
          notes: `Guest order - Email: ${orderData.email}, DOB: ${orderData.dateOfBirth}`,
        })
        .select()
        .single();

      if (orderError || !order) {
        logger.error('Failed to create order', orderError || new Error('Order creation failed'), {
          context: {
            userId: userId || 'guest',
            email: orderData.email,
            orderData: {
              subtotal: orderData.subtotal,
              totalAmount: orderData.totalAmount,
              paymentMethod: orderData.paymentMethod,
            },
          },
        });
        return {
          success: false,
          error: `Failed to create order: ${orderError?.message || 'Unknown error'}`,
        };
      }

      // Create order items
      const orderItems = orderData.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        product_price: item.price,
        product_weight_grams: item.variant.weight_grams,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      // Log order items for debugging
      logger.info('Creating order items', {
        context: {
          orderId: order.id,
          itemCount: orderItems.length,
          productIds: orderItems.map((item) => item.product_id),
          orderItems: orderItems.map((item) => ({
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
          })),
        },
      });

      // Validate that all products exist before creating order items
      const productIds = [...new Set(orderItems.map((item) => item.product_id))];
      const { data: existingProducts, error: validateError } = await supabase
        .from('products')
        .select('id')
        .in('id', productIds);

      if (validateError) {
        logger.error('Failed to validate products', validateError);
        // Clean up the order
        await supabase.from('orders').delete().eq('id', order.id);
        return { success: false, error: 'Failed to validate product information' };
      }

      const existingProductIds = existingProducts?.map((p) => p.id) || [];
      const missingProductIds = productIds.filter((id) => !existingProductIds.includes(id));

      if (missingProductIds.length > 0) {
        logger.error(
          'Order contains invalid product IDs',
          new Error('Invalid product IDs in cart'),
          {
            context: {
              missingProductIds,
              existingProductIds,
              allProductIds: productIds,
            },
          }
        );
        // Clean up the order
        await supabase.from('orders').delete().eq('id', order.id);
        return {
          success: false,
          error: `Invalid products in cart. Please refresh the page and try again.`,
        };
      }

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) {
        logger.error('Failed to create order items', itemsError);
        // Try to clean up the order
        await supabase.from('orders').delete().eq('id', order.id);
        return { success: false, error: 'Failed to create order items' };
      }

      // Update order status to confirmed
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', order.id);

      if (updateError) {
        logger.error('Failed to update order status', updateError);
        // Order is created but notification might not be sent
      }

      // Send order confirmation email
      try {
        const emailData = {
          orderNumber: order.order_number,
          orderId: order.id,
          customerEmail: orderData.email,
          customerName: `${orderData.firstName} ${orderData.lastName}`,
          items: orderData.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            weight_grams: item.variant.weight_grams,
          })),
          deliveryAddress: {
            street: orderData.deliveryAddress.street,
            apartment: orderData.deliveryAddress.apartment,
            city: orderData.deliveryAddress.city,
            state: orderData.deliveryAddress.state,
            zipCode: orderData.deliveryAddress.zipCode,
            phone: orderData.phone,
            instructions: orderData.deliveryAddress.deliveryInstructions,
          },
          totals: {
            subtotal: orderData.subtotal,
            tax: orderData.taxAmount,
            delivery: orderData.deliveryFee,
            total: orderData.totalAmount,
          },
        };

        await EmailService.sendOrderConfirmationEmail(emailData);
        logger.info('Order confirmation email sent', {
          context: { orderNumber: order.order_number, email: orderData.email },
        });
      } catch (emailError) {
        logger.error('Failed to queue order confirmation email', emailError as Error);
        // Don't fail the order if email fails
      }

      logger.info('Order created successfully', {
        context: {
          orderId: order.id,
          orderNumber: order.order_number,
          userId: userId || 'guest',
          email: orderData.email,
          totalAmount: orderData.totalAmount,
        },
      });

      return {
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
      };
    } catch (error) {
      logger.error('Unexpected error during order creation', error as Error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

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
