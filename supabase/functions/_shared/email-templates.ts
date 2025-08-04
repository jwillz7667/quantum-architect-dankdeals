// Email template engine
import type { Order, OrderItemRecord } from './types.ts';
import '../_shared/deno-types.d.ts';

export class EmailTemplateEngine {
  generateCustomerOrderConfirmation(order: Order): string {
    const items = order.order_items || [];

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - DankDeals</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4caf50; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .logo { height: 60px; margin-bottom: 20px; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .item { padding: 15px 0; border-bottom: 1px solid #e5e7eb; }
    .item:last-child { border-bottom: none; }
    .total { font-size: 1.2em; font-weight: bold; color: #4caf50; margin-top: 20px; }
    .address { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .step { padding: 10px 0; display: flex; align-items: center; }
    .step-icon { font-size: 1.5em; margin-right: 10px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 0.9em; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background: #4caf50; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    @media (max-width: 600px) {
      .container { padding: 10px; }
      .header, .content { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://dankdealsmn.com/logos/white-green-logo.svg" alt="DankDeals" class="logo" />
      <h1 style="margin: 10px 0;">Order Confirmed!</h1>
      <p style="margin: 0; font-size: 1.1em;">Order #${order.order_number}</p>
    </div>
    
    <div class="content">
      <p style="font-size: 1.1em;">Hi ${order.delivery_first_name},</p>
      <p>Thank you for your order! We've received it and a team member will contact you within 5 minutes to confirm your delivery details.</p>
      
      <div class="order-info">
        <h2 style="margin-top: 0; color: #1f2937;">Order Summary</h2>
        ${items
          .map(
            (item: OrderItemRecord) => `
          <div class="item">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div style="flex: 1;">
                <strong style="font-size: 1.1em;">${item.product_name}</strong>
                ${
                  item.product_strain_type || item.product_category
                    ? `
                  <div style="color: #6b7280; font-size: 0.9em; margin-top: 4px;">
                    ${item.product_strain_type || ''} ${item.product_category ? `• ${item.product_category}` : ''}
                  </div>
                `
                    : ''
                }
                ${
                  item.product_thc_percentage || item.product_cbd_percentage
                    ? `
                  <div style="color: #6b7280; font-size: 0.9em;">
                    ${item.product_thc_percentage ? `THC: ${item.product_thc_percentage}%` : ''}
                    ${item.product_thc_percentage && item.product_cbd_percentage ? ' • ' : ''}
                    ${item.product_cbd_percentage ? `CBD: ${item.product_cbd_percentage}%` : ''}
                  </div>
                `
                    : ''
                }
                <div style="margin-top: 8px;">
                  ${item.quantity} × $${item.unit_price.toFixed(2)}
                </div>
              </div>
              <div style="text-align: right;">
                <strong style="font-size: 1.1em;">$${item.total_price.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        `
          )
          .join('')}
        
        <div style="border-top: 2px solid #4caf50; padding-top: 15px; margin-top: 15px;">
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span>Subtotal:</span>
            <span>$${order.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span>Tax:</span>
            <span>$${order.tax_amount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span>Delivery Fee:</span>
            <span>$${order.delivery_fee.toFixed(2)}</span>
          </div>
          <div class="total" style="display: flex; justify-content: space-between; margin-top: 10px;">
            <span>Total:</span>
            <span>$${order.total_amount.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div class="address">
        <h3 style="margin-top: 0; color: #1f2937;">Delivery Information</h3>
        <div style="margin: 10px 0;">
          <strong>${order.delivery_first_name} ${order.delivery_last_name}</strong><br>
          ${order.delivery_street_address}${order.delivery_apartment ? `, ${order.delivery_apartment}` : ''}<br>
          ${order.delivery_city}, ${order.delivery_state} ${order.delivery_zip_code}
        </div>
        ${
          order.customer_phone_number
            ? `
          <div style="margin-top: 10px;">
            <strong>Phone:</strong> ${order.customer_phone_number}
          </div>
        `
            : ''
        }
        ${
          order.delivery_instructions
            ? `
          <div style="margin-top: 10px; padding: 10px; background: #fef3c7; border-radius: 6px;">
            <strong>Delivery Instructions:</strong> ${order.delivery_instructions}
          </div>
        `
            : ''
        }
      </div>
      
      <div class="warning">
        <strong style="font-size: 1.1em;">💵 Payment Method: CASH ON DELIVERY</strong><br>
        <p style="margin: 10px 0 0;">Please have exact cash ready for your driver. Payment is required upon delivery.</p>
      </div>
      
      <div class="steps">
        <h3 style="margin-top: 0; color: #1f2937;">What Happens Next?</h3>
        <div class="step">
          <span class="step-icon">☎️</span>
          <div>
            <strong>Step 1: Phone Confirmation</strong><br>
            <span style="color: #6b7280;">A team member will call you within 5 minutes</span>
          </div>
        </div>
        <div class="step">
          <span class="step-icon">📦</span>
          <div>
            <strong>Step 2: Order Preparation</strong><br>
            <span style="color: #6b7280;">Your order will be carefully prepared and packaged</span>
          </div>
        </div>
        <div class="step">
          <span class="step-icon">🚗</span>
          <div>
            <strong>Step 3: Delivery</strong><br>
            <span style="color: #6b7280;">A licensed driver will deliver to your address</span>
          </div>
        </div>
        <div class="step">
          <span class="step-icon">✅</span>
          <div>
            <strong>Step 4: ID Verification & Payment</strong><br>
            <span style="color: #6b7280;">Have your ID and cash ready (21+ only)</span>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="margin: 10px 0;"><strong>Need Help?</strong></p>
        <p style="margin: 5px 0;">📧 support@dankdealsmn.com</p>
        <p style="margin: 5px 0;">📱 763-247-5378</p>
      </div>
    </div>
    
    <div class="footer">
      <p>This email confirms your order has been received and is being processed.</p>
      <p style="margin: 10px 0 0;">© 2024 DankDeals - Minneapolis, MN | Licensed Cannabis Delivery | 21+ Only</p>
      <p style="margin: 5px 0; font-size: 0.8em;">
        <a href="https://dankdealsmn.com" style="color: #6b7280;">dankdealsmn.com</a> | 
        <a href="https://dankdealsmn.com/privacy" style="color: #6b7280;">Privacy Policy</a> | 
        <a href="https://dankdealsmn.com/terms" style="color: #6b7280;">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  generateAdminOrderNotification(order: Order): string {
    const items = order.order_items || [];
    const orderTime = new Date(order.created_at).toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      dateStyle: 'short',
      timeStyle: 'medium',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order - ${order.order_number}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .label { font-weight: bold; color: #4b5563; display: inline-block; min-width: 120px; }
    .value { color: #111827; }
    .item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .item:last-child { border-bottom: none; }
    .total { font-size: 1.3em; font-weight: bold; color: #dc2626; }
    .urgent { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .actions { background: #fee2e2; border: 1px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .phone { font-size: 1.3em; font-weight: bold; color: #dc2626; }
    @media (max-width: 600px) {
      .container { padding: 10px; }
      .header, .content { padding: 15px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🚨 NEW ORDER ALERT</h1>
      <p style="margin: 10px 0 0; font-size: 1.2em;">Immediate Action Required</p>
    </div>
    
    <div class="content">
      <div class="urgent">
        <strong style="font-size: 1.2em;">⏰ CALL CUSTOMER WITHIN 5 MINUTES!</strong><br>
        <div style="margin-top: 10px;">Order placed at: <strong>${orderTime}</strong></div>
      </div>
      
      <div class="info-box">
        <h2 style="margin-top: 0; color: #dc2626;">Order #${order.order_number}</h2>
        <p><span class="label">Total Amount:</span> <span class="value total">$${order.total_amount.toFixed(2)} CASH</span></p>
        <p><span class="label">Status:</span> <span class="value" style="text-transform: uppercase; font-weight: bold;">${order.status}</span></p>
        <p><span class="label">Payment:</span> <span class="value">CASH ON DELIVERY</span></p>
      </div>
      
      <div class="info-box">
        <h2 style="margin-top: 0;">Customer Information</h2>
        <p><span class="label">Name:</span> <span class="value">${order.delivery_first_name} ${order.delivery_last_name}</span></p>
        <p><span class="label">Phone:</span> <span class="value phone">${order.customer_phone_number || 'N/A'}</span></p>
        <p><span class="label">Email:</span> <span class="value">${order.customer_email || 'N/A'}</span></p>
        ${order.user_id ? `<p><span class="label">Customer ID:</span> <span class="value">${order.user_id}</span></p>` : ''}
      </div>
      
      <div class="info-box">
        <h2 style="margin-top: 0;">Delivery Address</h2>
        <div style="font-size: 1.1em; margin: 10px 0;">
          ${order.delivery_street_address}${order.delivery_apartment ? `, ${order.delivery_apartment}` : ''}<br>
          ${order.delivery_city}, ${order.delivery_state} ${order.delivery_zip_code}
        </div>
        ${
          order.delivery_instructions
            ? `
          <div style="margin-top: 15px; padding: 10px; background: #fef3c7; border-radius: 6px;">
            <strong>Special Instructions:</strong> ${order.delivery_instructions}
          </div>
        `
            : ''
        }
      </div>
      
      <div class="info-box">
        <h2 style="margin-top: 0;">Order Items (${items.length})</h2>
        ${items
          .map(
            (item: OrderItemRecord) => `
          <div class="item">
            <div style="display: flex; justify-content: space-between;">
              <div>
                <strong>${item.product_name}</strong>
                ${item.product_category ? ` (${item.product_category})` : ''}<br>
                <span style="color: #6b7280; font-size: 0.9em;">
                  ${item.product_strain_type || ''}
                  ${item.product_thc_percentage ? ` • THC: ${item.product_thc_percentage}%` : ''}
                  ${item.product_weight_grams ? ` • ${item.product_weight_grams}g` : ''}
                </span><br>
                <span style="margin-top: 5px;">Qty: ${item.quantity} × $${item.unit_price.toFixed(2)}</span>
              </div>
              <div style="text-align: right;">
                <strong style="font-size: 1.1em;">$${item.total_price.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        `
          )
          .join('')}
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #dc2626;">
          <p style="margin: 5px 0;"><span class="label">Subtotal:</span> $${order.subtotal.toFixed(2)}</p>
          <p style="margin: 5px 0;"><span class="label">Tax:</span> $${order.tax_amount.toFixed(2)}</p>
          <p style="margin: 5px 0;"><span class="label">Delivery Fee:</span> $${order.delivery_fee.toFixed(2)}</p>
          <p class="total" style="margin-top: 10px;"><span class="label">TOTAL DUE:</span> $${order.total_amount.toFixed(2)} CASH</p>
        </div>
      </div>
      
      <div class="actions">
        <h3 style="margin-top: 0;">📋 Required Actions:</h3>
        <ol style="margin: 10px 0; padding-left: 20px;">
          <li><strong>Call customer immediately</strong> at ${order.customer_phone_number || 'N/A'}</li>
          <li><strong>Confirm delivery address</strong> and time window</li>
          <li><strong>Verify customer is 21+</strong> and remind about ID requirement</li>
          <li><strong>Confirm cash payment</strong> of $${order.total_amount.toFixed(2)}</li>
          <li><strong>Assign driver</strong> and update order status in system</li>
          <li><strong>Send driver</strong> with order details and exact change</li>
        </ol>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding: 20px; background: #e5e7eb; border-radius: 8px;">
        <p style="margin: 0;"><strong>Admin Dashboard:</strong> <a href="https://dankdealsmn.com/admin/orders/${order.id}" style="color: #dc2626;">View Order Details</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  generateOrderUpdateEmail(order: Order, _updateType: string, message: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Update - DankDeals</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4caf50; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .update-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .status { display: inline-block; padding: 6px 12px; border-radius: 20px; font-weight: bold; text-transform: uppercase; font-size: 0.9em; }
    .status-confirmed { background: #d1fae5; color: #065f46; }
    .status-preparing { background: #fef3c7; color: #92400e; }
    .status-out_for_delivery { background: #dbeafe; color: #1e40af; }
    .status-delivered { background: #d1fae5; color: #065f46; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Order Update</h1>
      <p style="margin: 10px 0 0;">Order #${order.order_number}</p>
    </div>
    
    <div class="content">
      <p>Hi ${order.delivery_first_name},</p>
      
      <div class="update-box">
        <h2 style="margin-top: 0;">Your Order Status</h2>
        <p><span class="status status-${order.status}">${order.status.replace('_', ' ')}</span></p>
        <p style="margin: 20px 0 0; font-size: 1.1em;">${message}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="margin: 10px 0;"><strong>Questions?</strong></p>
        <p style="margin: 5px 0;">📧 support@dankdealsmn.com</p>
        <p style="margin: 5px 0;">📱 763-247-5378</p>
      </div>
    </div>
    
    <div class="footer">
      <p>© 2024 DankDeals - Minneapolis, MN | 21+ Only</p>
    </div>
  </div>
</body>
</html>`;
  }
}
