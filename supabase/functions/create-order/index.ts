import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

// Type definitions for Deno
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  name: string;
  weight?: number; // Weight in grams
}

interface DeliveryAddress {
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipcode: string;
  instructions?: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  strain_type?: string;
  thc_content?: number;
  cbd_content?: number;
}

interface CreateOrderRequest {
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

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log request details for debugging
    console.log('create-order function called:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
    });

    // Environment variables are automatically injected by Supabase
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      console.error('Missing environment variables');
      throw new Error('Server configuration error');
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create anon client for auth verification
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader ?? '',
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse and validate request body
    let orderData: CreateOrderRequest;
    try {
      orderData = await req.json();
    } catch (error) {
      console.error('Invalid JSON in request body:', error);
      return new Response(JSON.stringify({ success: false, error: 'Invalid request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('Order data received:', {
      order_number: orderData.customer_email,
      items_count: orderData.items?.length,
      total: orderData.total,
    });

    // Validate required fields
    const requiredFields = [
      'customer_name',
      'customer_email',
      'customer_phone',
      'delivery_first_name',
      'delivery_last_name',
      'delivery_address',
      'items',
    ];
    for (const field of requiredFields) {
      if (!orderData[field as keyof CreateOrderRequest]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orderData.customer_email)) {
      throw new Error('Invalid email format');
    }

    // Validate and clean phone number
    const phoneRegex = /^\+?1?\d{10,15}$/;
    const cleanPhone = orderData.customer_phone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      throw new Error('Invalid phone number format');
    }

    // Format phone for consistency
    const formattedPhone = cleanPhone.length === 10 ? `1${cleanPhone}` : cleanPhone;

    // Validate items array
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // Get authenticated user if available
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
      console.log('Auth check failed:', authError.message);
    }

    // Generate unique order number with better format
    const timestamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `DD-${timestamp}-${randomStr}`;

    console.log('Creating order:', orderNumber);

    // Create the order using admin client to bypass RLS
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user?.id || orderData.user_id || null,
        order_number: orderNumber,
        status: 'pending',

        // Store customer info
        customer_email: orderData.customer_email,
        customer_phone_number: formattedPhone,
        notes: `Email: ${orderData.customer_email}, Phone: ${formattedPhone}`,
        delivery_phone: formattedPhone,

        // Totals
        subtotal: orderData.subtotal,
        tax_amount: orderData.tax,
        delivery_fee: orderData.delivery_fee,
        total_amount: orderData.total,

        // Delivery info
        delivery_first_name: orderData.delivery_first_name,
        delivery_last_name: orderData.delivery_last_name,
        delivery_street_address: orderData.delivery_address.street,
        delivery_apartment: orderData.delivery_address.apartment || null,
        delivery_city: orderData.delivery_address.city,
        delivery_state: orderData.delivery_address.state || 'MN',
        delivery_zip_code: orderData.delivery_address.zipcode,
        delivery_instructions: orderData.delivery_address.instructions || null,

        // Payment
        payment_method: orderData.payment_method || 'cash',
        payment_status: 'pending',

        // Metadata
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation failed:', {
        error: orderError.message,
        code: orderError.code,
        details: orderError.details,
      });
      throw new Error('Failed to create order. Please try again.');
    }

    if (!order) {
      throw new Error('Order was not created');
    }

    // Fetch product details for each item to store snapshot data
    const productIds = orderData.items.map((item) => item.product_id);
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, description, category, strain_type, thc_content, cbd_content')
      .in('id', productIds);

    if (productsError) {
      console.error('Failed to fetch product details:', productsError);
    }

    // Create a map of product details
    const productMap = new Map<string, Product>(products?.map((p: Product) => [p.id, p]) || []);

    // Create order items with product snapshot data
    const orderItems = orderData.items.map((item) => {
      const product = productMap.get(item.product_id);

      return {
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        // Product snapshot data - include all required fields
        product_name: item.name || product?.name || 'Unknown Product',
        product_price: item.price, // Add product_price field
        product_weight_grams: item.weight || 3.5, // Use provided weight or default to 3.5g
        product_description: product?.description || null,
        product_category: product?.category || null,
        product_strain_type: product?.strain_type || null,
        product_thc_percentage: product?.thc_content || null,
        product_cbd_percentage: product?.cbd_content || null,
        created_at: new Date().toISOString(),
      };
    });

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);

    if (itemsError) {
      // Rollback order on items failure
      console.error('Order items creation failed:', itemsError);
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      throw new Error('Failed to create order. Please try again.');
    }

    // Log successful order creation
    console.log('Order created successfully:', {
      order_id: order.id,
      order_number: order.order_number,
      total: order.total_amount,
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          total: order.total_amount,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    // Log error details
    console.error('create-order error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Determine appropriate status code
    let status = 500;
    let message = 'An unexpected error occurred';

    if (error instanceof Error) {
      if (
        error.message.includes('Missing required') ||
        error.message.includes('Invalid') ||
        error.message.includes('must contain')
      ) {
        status = 400;
        message = error.message;
      } else if (error.message.includes('Server configuration')) {
        status = 500;
        message = 'Server error. Please try again later.';
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status,
      }
    );
  }
});
