import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Environment variables are automatically injected by Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'admin@dankdealsmn.com';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'orders@dankdealsmn.com';

import { corsHeaders } from '../_shared/cors.ts';

interface OrderEmailPayload {
  orderId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing required Supabase environment variables');
      throw new Error('Server configuration error');
    }

    if (!RESEND_API_KEY) {
      console.error('Missing RESEND_API_KEY environment variable');
      throw new Error('Email service not configured');
    }

    console.log('send-order-emails function called:', {
      method: req.method,
      admin_email: ADMIN_EMAIL,
      from_email: FROM_EMAIL,
    });

    // Create admin client for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse request body
    let payload: OrderEmailPayload;
    try {
      payload = await req.json();
    } catch (error) {
      console.error('Invalid JSON in request body:', error);
      return new Response(JSON.stringify({ success: false, error: 'Invalid request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { orderId } = payload;

    if (!orderId) {
      return new Response(JSON.stringify({ success: false, error: 'Missing orderId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('Processing order:', orderId);

    // Validate orderId format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

    // First fetch order details with items
    let orderQuery = supabase.from('orders').select(`
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
        )
      `);

    // Use appropriate field based on input format
    if (isUUID) {
      orderQuery = orderQuery.eq('id', orderId);
    } else {
      orderQuery = orderQuery.eq('order_number', orderId);
    }

    const { data: order, error: orderError } = await orderQuery.single();

    if (orderError || !order) {
      console.error('Order lookup failed:', orderError);
      throw new Error('Order not found');
    }

    // Fetch profile data if user_id exists
    let profileData = null;
    if (order.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, first_name, last_name, phone')
        .eq('id', order.user_id)
        .single();
      profileData = profile;
    }

    // Add profiles data to order for email template
    order.profiles = profileData;

    // Extract customer email - use customer_email field first, then fall back to profile
    let customerEmail = order.customer_email || order.profiles?.email;
    if (!customerEmail && order.notes) {
      // Legacy support: Try to extract email from notes for old orders
      const emailMatch =
        order.notes.match(/Email:\s*([^,\s]+)/i) ||
        order.notes.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      customerEmail = emailMatch?.[1];
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
      <p>Hi ${order.profiles?.first_name || order.delivery_first_name},</p>
      <p>Thank you for your order! A team member will contact you within 5 minutes to confirm your delivery details.</p>
      
      <div class="order-info">
        <h2 style="margin-top: 0;">Order Details</h2>
        ${order.order_items
          .map(
            (item: any) => `
          <div class="item">
            <strong>${item.product_name}</strong><br>
            <span style="color: #6b7280;">
              ${item.product_strain_type ? `${item.product_strain_type} • ` : ''}
              ${item.product_thc_percentage ? `THC: ${item.product_thc_percentage}% • ` : ''}
              ${item.product_cbd_percentage ? `CBD: ${item.product_cbd_percentage}%` : ''}
            </span><br>
            Quantity: ${item.quantity} × $${item.unit_price.toFixed(2)} = <strong>$${item.total_price.toFixed(2)}</strong>
          </div>
        `
          )
          .join('')}
        
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
          Phone: ${order.customer_phone_number || order.delivery_phone || 'N/A'}
        </p>
        ${order.delivery_instructions ? `<p style="margin: 10px 0 0;"><em>Delivery Instructions: ${order.delivery_instructions}</em></p>` : ''}
      </div>
      
      <div class="warning">
        <strong>Payment Method:</strong> CASH DUE ON DELIVERY<br>
        Please have exact cash ready for your driver. Payment is required upon delivery.
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
    `;

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
        <p><span class="label">Name:</span> <span class="value">${order.profiles?.first_name || order.delivery_first_name} ${order.profiles?.last_name || order.delivery_last_name}</span></p>
        <p><span class="label">Phone:</span> <span class="value" style="font-size: 1.1em; color: #dc2626;">${order.customer_phone_number || order.delivery_phone || 'N/A'}</span></p>
        <p><span class="label">Email:</span> <span class="value">${customerEmail || 'N/A'}</span></p>
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
        ${order.order_items
          .map(
            (item: any) => `
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
        `
          )
          .join('')}
        
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
          <li>Call customer immediately at ${order.customer_phone_number || order.delivery_phone || 'N/A'}</li>
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
    `;

    // Send emails using Resend API
    const emailPromises = [];

    // Only send customer email if we have a valid email address
    if (customerEmail && customerEmail !== 'guest@example.com') {
      emailPromises.push(
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `DankDeals <${FROM_EMAIL}>`,
            to: customerEmail,
            subject: `Order Confirmed - ${order.order_number}`,
            html: customerEmailHtml,
          }),
        })
      );
    } else {
      console.log(
        `No customer email for order ${order.order_number}, skipping customer notification`
      );
    }

    // Always send admin notification email
    const adminEmailPayload = {
      from: `DankDeals Orders <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `🚨 NEW ORDER - ${order.order_number} - $${order.total_amount.toFixed(2)}`,
      html: adminEmailHtml,
    };

    emailPromises.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(adminEmailPayload),
      })
    );

    console.log('Sending emails:', {
      order_number: order.order_number,
      customer_email: customerEmail || 'None',
      admin_email: ADMIN_EMAIL,
      email_count: emailPromises.length,
    });

    // Execute email sends with delay to avoid rate limiting
    const results = [];
    const emailTypes = [];

    // Track which email is which based on whether customer email exists
    const hasCustomerEmail = customerEmail && customerEmail !== 'guest@example.com';

    for (let i = 0; i < emailPromises.length; i++) {
      const result = await emailPromises[i];
      // If we have a customer email, first email is customer, second is admin
      // If no customer email, only email is admin
      const emailType = hasCustomerEmail && i === 0 ? 'customer' : 'admin';
      emailTypes.push(emailType);

      if (!result.ok) {
        const errorText = await result.text();
        console.error(`${emailType} email failed:`, {
          status: result.status,
          error: errorText,
        });
        results.push({ success: false, type: emailType, error: errorText, status: result.status });
      } else {
        const responseData = await result.json();
        console.log(`${emailType} email sent successfully`);
        results.push({ success: true, type: emailType, response: responseData });
      }

      // Add delay between requests to avoid rate limiting (Resend allows 2 req/sec)
      if (i < emailPromises.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 600)); // 600ms delay
      }
    }

    // Check email results
    const successCount = results.filter((result) => result.success).length;
    const adminEmailResult = results.find((r) => r.type === 'admin');

    console.log('Email send results:', {
      success_count: successCount,
      total_count: results.length,
      admin_sent: adminEmailResult?.success || false,
    });

    if (successCount === 0) {
      console.error('All email sends failed');
      throw new Error('Failed to send notification emails');
    } else if (successCount < results.length) {
      const failedTypes = results.filter((r) => !r.success).map((r) => r.type);
      console.warn('Some emails failed:', {
        failed: failedTypes,
        successful: successCount,
      });
    }

    // Create notification record if user is authenticated
    if (order.user_id) {
      const { error: notificationError } = await supabase.from('notifications').insert({
        user_id: order.user_id,
        type: 'order_update',
        title: 'Order Confirmation',
        message: `Your order ${order.order_number} has been confirmed. Check your email for details.`,
        data: { orderId: order.id, orderNumber: order.order_number },
      });

      if (notificationError) {
        console.warn('Failed to create notification:', notificationError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order confirmation emails sent successfully',
        emailsSent: successCount,
        totalEmails: results.length,
        customerEmail,
        adminEmail: ADMIN_EMAIL,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('send-order-emails error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send emails',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error instanceof Error && error.message.includes('not found') ? 404 : 500,
      }
    );
  }
});
