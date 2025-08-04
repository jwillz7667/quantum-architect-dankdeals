// Order processor with transaction support
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import {
  Order,
  OrderHooks,
  CreateOrderRequest,
  Product,
  OrderItemRecord,
  OrderProcessingError,
  InsufficientStockError,
} from './types.ts';
import { logger } from './logger.ts';
import '../_shared/deno-types.d.ts';

interface ProcessedOrder extends Order {
  order_items: OrderItemRecord[];
}

export class OrderProcessor {
  private supabase;

  constructor() {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !key) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async processOrder(
    data: CreateOrderRequest,
    hooks: OrderHooks = {}
  ): Promise<{ success: boolean; order: ProcessedOrder }> {
    const startTime = Date.now();
    let order: ProcessedOrder | null = null;

    try {
      // Generate unique order number
      const orderNumber = this.generateOrderNumber();
      logger.info('Processing order', { orderNumber });

      // Begin transaction-like operations
      // Note: Supabase doesn't support true transactions in edge functions,
      // so we'll use careful ordering and cleanup on failure

      // 1. Create the order
      const { data: createdOrder, error: orderError } = await this.supabase
        .from('orders')
        .insert({
          user_id: data.user_id || null,
          order_number: orderNumber,
          status: 'pending',
          customer_email: data.customer_email,
          customer_phone_number: data.customer_phone,
          delivery_phone: data.customer_phone,
          notes: `Email: ${data.customer_email}, Phone: ${data.customer_phone}`,
          subtotal: data.subtotal,
          tax_amount: data.tax,
          delivery_fee: data.delivery_fee,
          total_amount: data.total,
          delivery_first_name: data.delivery_first_name,
          delivery_last_name: data.delivery_last_name,
          delivery_street_address: data.delivery_address.street,
          delivery_apartment: data.delivery_address.apartment || null,
          delivery_city: data.delivery_address.city,
          delivery_state: data.delivery_address.state || 'MN',
          delivery_zip_code: data.delivery_address.zipcode,
          delivery_instructions: data.delivery_address.instructions || null,
          payment_method: data.payment_method || 'cash',
          payment_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError || !createdOrder) {
        throw new OrderProcessingError('Failed to create order', orderError);
      }

      order = createdOrder as ProcessedOrder;
      logger.info('Order created', { orderId: order.id, orderNumber });

      // 2. Fetch product details for snapshot data
      const productIds = data.items.map((item) => item.product_id);
      const { data: products, error: productsError } = await this.supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (productsError) {
        logger.warn('Failed to fetch product details', { error: productsError });
      }

      const productMap = new Map<string, Product>(products?.map((p: Product) => [p.id, p]) || []);

      // 3. Create order items with snapshot data
      const orderItems = data.items.map((item) => {
        const product = productMap.get(item.product_id);

        return {
          order_id: order!.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          product_name: item.name || product?.name || 'Unknown Product',
          product_price: item.price,
          product_weight_grams: item.weight || 3.5,
          product_description: product?.description || null,
          product_category: product?.category || null,
          product_strain_type: product?.strain_type || null,
          product_thc_percentage: product?.thc_content || null,
          product_cbd_percentage: product?.cbd_content || null,
          created_at: new Date().toISOString(),
        };
      });

      const { data: insertedItems, error: itemsError } = await this.supabase
        .from('order_items')
        .insert(orderItems)
        .select();

      if (itemsError) {
        // Rollback: delete the order
        await this.rollbackOrder(order.id);
        throw new OrderProcessingError('Failed to create order items', itemsError);
      }

      order.order_items = insertedItems as OrderItemRecord[];

      // 4. Update inventory (if stock tracking is enabled)
      try {
        await this.updateInventory(data.items);
      } catch (error) {
        // Rollback: delete order and items
        await this.rollbackOrder(order.id);
        throw error;
      }

      // 5. Create audit log
      await this.createAuditLog(order.id, 'ORDER_CREATED', {
        orderNumber,
        total: data.total,
        itemCount: data.items.length,
      });

      // 6. Execute success hook (e.g., queue emails)
      if (hooks.onSuccess) {
        try {
          await hooks.onSuccess(order);
        } catch (error) {
          logger.error('Success hook failed', error, { orderId: order.id });
          // Don't fail the order for hook failures
        }
      }

      const duration = Date.now() - startTime;
      logger.info('Order processed successfully', {
        orderId: order.id,
        orderNumber,
        duration,
      });

      return { success: true, order };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Order processing failed', error, { duration });

      if (hooks.onFailure) {
        try {
          await hooks.onFailure(error as Error);
        } catch (hookError) {
          logger.error('Failure hook error', hookError);
        }
      }

      throw error;
    }
  }

  private generateOrderNumber(): string {
    const timestamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DD-${timestamp}-${randomStr}`;
  }

  private async updateInventory(
    items: Array<{ product_id: string; quantity: number }>
  ): Promise<void> {
    // Check inventory levels
    for (const item of items) {
      const { data: product, error } = await this.supabase
        .from('products')
        .select('id, stock_quantity')
        .eq('id', item.product_id)
        .single();

      if (error || !product) {
        logger.warn('Product not found for inventory check', { productId: item.product_id });
        continue;
      }

      // Only check if stock_quantity is tracked (not null)
      if (product.stock_quantity !== null && product.stock_quantity < item.quantity) {
        throw new InsufficientStockError(item.product_id);
      }
    }

    // Update inventory
    for (const item of items) {
      const { error } = await this.supabase.rpc('decrement_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      });

      if (error) {
        logger.warn('Failed to update inventory', {
          productId: item.product_id,
          error,
        });
      }
    }
  }

  private async rollbackOrder(orderId: string): Promise<void> {
    logger.info('Rolling back order', { orderId });

    try {
      // Delete order items first (due to foreign key constraint)
      await this.supabase.from('order_items').delete().eq('order_id', orderId);

      // Delete the order
      await this.supabase.from('orders').delete().eq('id', orderId);

      logger.info('Order rolled back successfully', { orderId });
    } catch (error) {
      logger.error('Rollback failed', error, { orderId });
    }
  }

  private async createAuditLog(
    orderId: string,
    action: string,
    details: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.supabase.from('order_processing_logs').insert({
        order_id: orderId,
        action,
        status: 'success',
        details,
        correlation_id: logger.context.correlationId,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.warn('Failed to create audit log', { error, orderId, action });
    }
  }
}
