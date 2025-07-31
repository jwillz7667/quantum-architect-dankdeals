import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { corsHeaders } from '../_shared/cors.ts'

interface OrderItem {
  product_id: string
  quantity: number
  price: number
  name: string
}

interface DeliveryAddress {
  street: string
  apartment?: string
  city: string
  state: string
  zipcode: string
  instructions?: string
}

interface CreateOrderRequest {
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address: DeliveryAddress
  subtotal: number
  delivery_fee: number
  tax: number
  total: number
  payment_method: string
  items: OrderItem[]
  user_id?: string | null
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader ?? '',
          },
        },
      }
    )

    // Parse request body
    const orderData: CreateOrderRequest = await req.json()

    // Validate required fields
    const requiredFields = ['customer_name', 'customer_email', 'customer_phone', 'delivery_address', 'items']
    for (const field of requiredFields) {
      if (!orderData[field as keyof CreateOrderRequest]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(orderData.customer_email)) {
      throw new Error('Invalid email format')
    }

    // Validate phone format (US)
    const phoneRegex = /^\+?1?\d{10,11}$/
    const cleanPhone = orderData.customer_phone.replace(/\D/g, '')
    if (!phoneRegex.test(cleanPhone)) {
      throw new Error('Invalid phone number format')
    }

    // Validate items array
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item')
    }

    // Get authenticated user if available
    const { data: { user } } = await supabase.auth.getUser()

    // Generate order number
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
    const orderNumber = `DD${timestamp}${randomStr}`

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user?.id || orderData.user_id || null,
        order_number: orderNumber,
        status: 'pending',
        
        // Customer info
        customer_email: orderData.customer_email,
        customer_phone_number: cleanPhone,
        
        // Totals
        subtotal: orderData.subtotal,
        tax_amount: orderData.tax,
        delivery_fee: orderData.delivery_fee,
        discount_amount: 0,
        total_amount: orderData.total,
        
        // Delivery info
        delivery_first_name: orderData.customer_name.split(' ')[0] || orderData.customer_name,
        delivery_last_name: orderData.customer_name.split(' ').slice(1).join(' ') || '',
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
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      throw new Error(`Failed to create order: ${orderError.message}`)
    }

    if (!order) {
      throw new Error('Order was not created')
    }

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: null, // Handle variants if needed
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.quantity * item.price,
      created_at: new Date().toISOString()
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      // If items fail, we should delete the order to maintain consistency
      await supabase.from('orders').delete().eq('id', order.id)
      console.error('Order items creation error:', itemsError)
      throw new Error(`Failed to create order items: ${itemsError.message}`)
    }

    // Trigger email notification (async, don't wait)
    // The email trigger will handle this automatically

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          total: order.total_amount
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in create-order function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: error instanceof Error && error.message.includes('Missing required') ? 400 : 500,
      }
    )
  }
})