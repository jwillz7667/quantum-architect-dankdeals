// @ts-ignore - Deno types
/// <reference types="https://deno.land/x/types/index.d.ts" />

// @ts-ignore - Deno module
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno module
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

declare const Deno: any;

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'admin@dankdealsmn.com'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'orders@dankdealsmn.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderEmailPayload {
  orderId: string
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    const { orderId } = await req.json() as OrderEmailPayload

    // Fetch order details with user info and items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            name,
            category,
            thc_content,
            cbd_content,
            strain_type
          )
        ),
        profiles!inner (
          email,
          first_name,
          last_name,
          phone
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderError?.message}`)
    }

    // Generate customer email HTML
    const customerEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - DankDeals</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .item { padding: 15px 0; border-bottom: 1px solid #e5e7eb; }
    .item:last-child { border-bottom: none; }
    .total { font-size: 1.2em; font-weight: bold; color: #1e40af; margin-top: 20px; }
    .address { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .step { padding: 10px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 0.9em; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed!</h1>
      <p style="margin: 0;">Order #${order.order_number}</p>
    </div>
    
    <div class="content">
      <p>Hi ${order.profiles.first_name},</p>
      <p>Thank you for your order! A team member will contact you within 5 minutes to confirm your delivery details.</p>
      
      <div class="order-info">
        <h2 style="margin-top: 0;">Order Details</h2>
        ${order.order_items.map((item: any) => `
          <div class="item">
            <strong>${item.product_name}</strong><br>
            <span style="color: #6b7280;">
              ${item.product_strain_type ? `${item.product_strain_type} • ` : ''}
              ${item.product_thc_percentage ? `THC: ${item.product_thc_percentage}% • ` : ''}
              ${item.product_cbd_percentage ? `CBD: ${item.product_cbd_percentage}%` : ''}
            </span><br>
            Quantity: ${item.quantity} × $${item.unit_price.toFixed(2)} = <strong>$${item.total_price.toFixed(2)}</strong>
          </div>
        `).join('')}
        
        <div style="border-top: 2px solid #1e40af; padding-top: 15px; margin-top: 15px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>$${order.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Tax:</span>
            <span>$${order.tax_amount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Delivery Fee:</span>
            <span>$${order.delivery_fee.toFixed(2)}</span>
          </div>
          <div class="total" style="display: flex; justify-content: space-between;">
            <span>Total:</span>
            <span>$${order.total_amount.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div class="address">
        <h3 style="margin-top: 0;">Delivery Address</h3>
        <p style="margin: 0;">
          ${order.delivery_first_name} ${order.delivery_last_name}<br>
          ${order.delivery_street_address} ${order.delivery_apartment || ''}<br>
          ${order.delivery_city}, ${order.delivery_state} ${order.delivery_zip_code}<br>
          Phone: ${order.delivery_phone}
        </p>
        ${order.delivery_instructions ? `<p style="margin: 10px 0 0;"><em>Delivery Instructions: ${order.delivery_instructions}</em></p>` : ''}
      </div>
      
      <div class="warning">
        <strong>Payment Method:</strong> Cash on Delivery<br>
        Please have exact cash ready for your driver.
      </div>
      
      <div class="steps">
        <h3 style="margin-top: 0;">What Happens Next?</h3>
        <div class="step">✅ <strong>Step 1:</strong> A team member will call you within 5 minutes</div>
        <div class="step">⏱️ <strong>Step 2:</strong> Your order will be carefully prepared</div>
        <div class="step">🚗 <strong>Step 3:</strong> A licensed driver will deliver your order</div>
        <div class="step">🆔 <strong>Step 4:</strong> Have your ID and cash ready at delivery</div>
      </div>
      
      <p style="margin-top: 30px;">
        <strong>Questions?</strong> Contact us at:<br>
        📧 support@dankdealsmn.com<br>
        📱 763-247-5378
      </p>
    </div>
    
    <div class="footer">
      <p>This email confirms your order has been received and is being processed.</p>
      <p>© 2024 DankDeals - Minneapolis, MN | 21+ Only</p>
    </div>
  </div>
</body>
</html>
    `

    // Generate admin email HTML
    const adminEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Alert - DankDeals</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .label { font-weight: bold; color: #4b5563; }
    .value { color: #111827; }
    .item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .item:last-child { border-bottom: none; }
    .total { font-size: 1.2em; font-weight: bold; color: #dc2626; }
    .urgent { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 NEW ORDER ALERT</h1>
      <p style="margin: 0; font-size: 1.2em;">Immediate Action Required</p>
    </div>
    
    <div class="content">
      <div class="urgent">
        <strong>⏰ CALL CUSTOMER WITHIN 5 MINUTES!</strong><br>
        Order placed at: ${new Date(order.created_at).toLocaleString('en-US', { timeZone: 'America/Chicago' })}
      </div>
      
      <div class="info-box">
        <h2 style="margin-top: 0;">Order Information</h2>
        <p><span class="label">Order Number:</span> <span class="value">${order.order_number}</span></p>
        <p><span class="label">Total Amount:</span> <span class="value total">$${order.total_amount.toFixed(2)} (CASH)</span></p>
        <p><span class="label">Status:</span> <span class="value">${order.status}</span></p>
      </div>
      
      <div class="info-box">
        <h2 style="margin-top: 0;">Customer Information</h2>
        <p><span class="label">Name:</span> <span class="value">${order.profiles.first_name} ${order.profiles.last_name}</span></p>
        <p><span class="label">Phone:</span> <span class="value" style="font-size: 1.1em; color: #dc2626;">${order.delivery_phone}</span></p>
        <p><span class="label">Email:</span> <span class="value">${order.profiles.email}</span></p>
      </div>
      
      <div class="info-box">
        <h2 style="margin-top: 0;">Delivery Address</h2>
        <p style="margin: 0;">
          ${order.delivery_street_address} ${order.delivery_apartment || ''}<br>
          ${order.delivery_city}, ${order.delivery_state} ${order.delivery_zip_code}
        </p>
        ${order.delivery_instructions ? `<p style="margin: 10px 0 0; color: #dc2626;"><strong>Special Instructions:</strong> ${order.delivery_instructions}</p>` : ''}
      </div>
      
      <div class="info-box">
        <h2 style="margin-top: 0;">Order Items</h2>
        ${order.order_items.map((item: any) => `
          <div class="item">
            <strong>${item.product_name}</strong>
            ${item.products?.category ? ` (${item.products.category})` : ''}<br>
            <span style="color: #6b7280;">
              ${item.product_strain_type || ''}
              ${item.product_thc_percentage ? ` • THC: ${item.product_thc_percentage}%` : ''}
              ${item.product_weight_grams ? ` • ${item.product_weight_grams}g` : ''}
            </span><br>
            Qty: ${item.quantity} × $${item.unit_price.toFixed(2)} = <strong>$${item.total_price.toFixed(2)}</strong>
          </div>
        `).join('')}
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #dc2626;">
          <p><span class="label">Subtotal:</span> $${order.subtotal.toFixed(2)}</p>
          <p><span class="label">Tax:</span> $${order.tax_amount.toFixed(2)}</p>
          <p><span class="label">Delivery Fee:</span> $${order.delivery_fee.toFixed(2)}</p>
          <p class="total"><span class="label">TOTAL DUE:</span> $${order.total_amount.toFixed(2)} CASH</p>
        </div>
      </div>
      
      <div style="background: #fee2e2; border: 1px solid #dc2626; padding: 15px; border-radius: 8px; margin-top: 30px;">
        <strong>Action Items:</strong>
        <ol style="margin: 10px 0;">
          <li>Call customer immediately at ${order.delivery_phone}</li>
          <li>Confirm delivery address and time window</li>
          <li>Verify age (21+) and remind about ID requirement</li>
          <li>Confirm cash payment of $${order.total_amount.toFixed(2)}</li>
          <li>Assign driver and update order status</li>
        </ol>
      </div>
    </div>
  </div>
</body>
</html>
    `

    // Send emails using Resend API
    const emailPromises = []

    // Send customer confirmation email
    emailPromises.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: `DankDeals <${FROM_EMAIL}>`,
          to: order.profiles.email,
          subject: `Order Confirmed - ${order.order_number}`,
          html: customerEmailHtml
        })
      })
    )

    // Send admin notification email
    emailPromises.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: `DankDeals Orders <${FROM_EMAIL}>`,
          to: ADMIN_EMAIL,
          subject: `🚨 NEW ORDER - ${order.order_number} - $${order.total_amount.toFixed(2)}`,
          html: adminEmailHtml
        })
      })
    )

    // Execute both email sends
    const results = await Promise.all(emailPromises)
    
    // Check if both emails were sent successfully
    const allSuccessful = results.every(result => result.ok)
    
    if (!allSuccessful) {
      const errors = await Promise.all(results.map(r => r.text()))
      throw new Error(`Failed to send some emails: ${errors.join(', ')}`)
    }

    // Log email sent in notifications table
    await supabase
      .from('notifications')
      .insert([
        {
          user_id: order.user_id,
          type: 'order_update',
          title: 'Order Confirmation',
          message: `Your order ${order.order_number} has been confirmed. Check your email for details.`,
          data: { orderId: order.id, orderNumber: order.order_number }
        }
      ])

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order confirmation emails sent successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending order emails:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 