/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { CartItem } from '@/hooks/useCart';

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
        // For guest checkout, try to find existing user or create a temporary one
        const { data: existingUser, error: searchError } = await supabase.auth.admin.listUsers();

        if (!searchError && existingUser?.users) {
          const userWithEmail = existingUser.users.find((u: any) => u.email === orderData.email);
          if (userWithEmail) {
            userId = userWithEmail.id;

            // Update profile for guest user
            await supabase.from('profiles').upsert({
              id: userWithEmail.id,
              email: orderData.email,
              first_name: orderData.firstName,
              last_name: orderData.lastName,
              phone: orderData.phone,
              date_of_birth: orderData.dateOfBirth,
              updated_at: new Date().toISOString(),
            });
          } else {
            // Create new guest user
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
              email: orderData.email,
              password: crypto.randomUUID(), // Generate random password for guest
              email_confirm: true,
              user_metadata: {
                first_name: orderData.firstName,
                last_name: orderData.lastName,
                phone: orderData.phone,
                date_of_birth: orderData.dateOfBirth,
              },
            });

            if (authError) {
              logger.error('Failed to create guest user', authError);
              return {
                success: false,
                error: `Failed to create user account: ${authError.message}`,
              };
            }

            userId = authData.user?.id || null;
          }
        } else {
          logger.error('Failed to search for existing users', searchError);
          return { success: false, error: 'Failed to process user information' };
        }
      }

      if (!userId) {
        return { success: false, error: 'Failed to identify user' };
      }

      // Generate order number
      const orderNumber = this.generateOrderNumber();

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
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
        })
        .select()
        .single();

      if (orderError || !order) {
        logger.error('Failed to create order', orderError);
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

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) {
        logger.error('Failed to create order items', itemsError);
        // Try to clean up the order
        await supabase.from('orders').delete().eq('id', order.id);
        return { success: false, error: 'Failed to create order items' };
      }

      // Update order status to confirmed to trigger email notifications
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', order.id);

      if (updateError) {
        logger.error('Failed to update order status', updateError);
        // Order is created but notification might not be sent
      }

      logger.info('Order created successfully', {
        context: {
          orderId: order.id,
          orderNumber: order.order_number,
          userId,
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
        logger.error('Failed to fetch order', error);
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
