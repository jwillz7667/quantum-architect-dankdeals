#!/usr/bin/env node

/**
 * Order Confirmation Email Script using Resend
 *
 * Usage:
 *   node scripts/send-order-confirmation.js ORDER_NUMBER
 *
 * Example:
 *   node scripts/send-order-confirmation.js 20250715-0001
 */

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

// Order confirmation email template
const createOrderConfirmationHTML = (order) => {
  const formatCurrency = (amount) => `$${Number(amount).toFixed(2)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - DankDeals MN</title>
  <style>
    body { 
      font-family: 'Arial', sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0; 
      padding: 0; 
      background-color: #f4f4f4; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      padding: 20px; 
      border-radius: 10px; 
      box-shadow: 0 0 20px rgba(0,0,0,0.1); 
    }
    .header { 
      text-align: center; 
      border-bottom: 3px solid #2d5a2d; 
      padding-bottom: 20px; 
      margin-bottom: 30px; 
    }
    .logo { 
      font-size: 28px; 
      font-weight: bold; 
      color: #2d5a2d; 
      margin-bottom: 10px; 
    }
    .order-number { 
      background: #2d5a2d; 
      color: white; 
      padding: 10px 20px; 
      border-radius: 25px; 
      display: inline-block; 
      font-weight: bold; 
      margin: 20px 0; 
    }
    .section { 
      margin: 25px 0; 
      padding: 20px; 
      background: #f9f9f9; 
      border-radius: 8px; 
    }
    .section h3 { 
      color: #2d5a2d; 
      margin-top: 0; 
      border-bottom: 2px solid #2d5a2d; 
      padding-bottom: 10px; 
    }
    .item { 
      display: flex; 
      justify-content: space-between; 
      padding: 10px 0; 
      border-bottom: 1px solid #eee; 
    }
    .item:last-child { 
      border-bottom: none; 
    }
    .total { 
      background: #2d5a2d; 
      color: white; 
      padding: 15px; 
      border-radius: 8px; 
      font-size: 18px; 
      font-weight: bold; 
      text-align: center; 
    }
    .important-note { 
      background: #fff3cd; 
      border: 1px solid #ffeaa7; 
      color: #856404; 
      padding: 15px; 
      border-radius: 8px; 
      margin: 20px 0; 
    }
    .footer { 
      text-align: center; 
      margin-top: 30px; 
      padding-top: 20px; 
      border-top: 1px solid #eee; 
      color: #666; 
      font-size: 14px; 
    }
    .contact-info { 
      background: #e8f5e8; 
      padding: 15px; 
      border-radius: 8px; 
      text-align: center; 
      margin: 20px 0; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🌿 DankDeals MN</div>
      <p>Premium Cannabis Delivery Service</p>
      <div class="order-number">Order #${order.order_number}</div>
    </div>

    <h2>Thank you for your order!</h2>
    <p>We've received your order and it's being prepared for delivery. You'll receive updates as your order progresses.</p>

    <div class="section">
      <h3>📦 Order Details</h3>
      ${order.order_items
        .map(
          (item) => `
        <div class="item">
          <div>
            <strong>${item.product_name}</strong><br>
            <small>Quantity: ${item.quantity} | Weight: ${item.product_weight_grams}g</small>
          </div>
          <div><strong>${formatCurrency(item.total_price)}</strong></div>
        </div>
      `
        )
        .join('')}
    </div>

    <div class="section">
      <h3>🚚 Delivery Information</h3>
      <p><strong>Delivery Address:</strong><br>
      ${order.delivery_first_name} ${order.delivery_last_name}<br>
      ${order.delivery_street_address}${order.delivery_apartment ? ` ${order.delivery_apartment}` : ''}<br>
      ${order.delivery_city}, ${order.delivery_state} ${order.delivery_zip_code}</p>
      
      ${order.delivery_instructions ? `<p><strong>Delivery Instructions:</strong><br>${order.delivery_instructions}</p>` : ''}
      
      <p><strong>Phone:</strong> ${order.delivery_phone}</p>
      <p><strong>Estimated Delivery:</strong> Within 2-4 hours</p>
    </div>

    <div class="section">
      <h3>💰 Order Summary</h3>
      <div class="item">
        <span>Subtotal:</span>
        <span>${formatCurrency(order.subtotal)}</span>
      </div>
      <div class="item">
        <span>Tax:</span>
        <span>${formatCurrency(order.tax_amount)}</span>
      </div>
      <div class="item">
        <span>Delivery Fee:</span>
        <span>${formatCurrency(order.delivery_fee)}</span>
      </div>
      <div class="total">
        Total: ${formatCurrency(order.total_amount)}
      </div>
    </div>

    <div class="important-note">
      <strong>⚠️ Important Reminders:</strong>
      <ul>
        <li>Payment is <strong>cash on delivery</strong> - please have exact change ready</li>
        <li>Valid ID required - must be 21+ years old</li>
        <li>Tip suggestions: 15% (${formatCurrency(order.total_amount * 0.15)}), 18% (${formatCurrency(order.total_amount * 0.18)}), 20% (${formatCurrency(order.total_amount * 0.2)})</li>
        <li>Please be available at the delivery address during the estimated time</li>
      </ul>
    </div>

    <div class="contact-info">
      <h3>📞 Need Help?</h3>
      <p><strong>Call or Text:</strong> <a href="tel:763-247-5378">(763) 247-5378</a></p>
      <p><strong>Email:</strong> <a href="mailto:support@dankdealsmn.com">support@dankdealsmn.com</a></p>
    </div>

    <div class="footer">
      <p>This email was sent to confirm your order with DankDeals MN.</p>
      <p>&copy; 2025 DankDeals MN. All rights reserved.</p>
      <p><small>This email contains information about cannabis products. Must be 21+ to receive.</small></p>
    </div>
  </div>
</body>
</html>`;
};

// Text version for email clients that don't support HTML
const createOrderConfirmationText = (order) => {
  const formatCurrency = (amount) => `$${Number(amount).toFixed(2)}`;

  return `
DankDeals MN - Order Confirmation

Order #${order.order_number}

Thank you for your order! We've received your order and it's being prepared for delivery.

ORDER DETAILS:
${order.order_items
  .map(
    (item) =>
      `- ${item.product_name} (Qty: ${item.quantity}, ${item.product_weight_grams}g) - ${formatCurrency(item.total_price)}`
  )
  .join('\n')}

DELIVERY INFORMATION:
${order.delivery_first_name} ${order.delivery_last_name}
${order.delivery_street_address}${order.delivery_apartment ? ` ${order.delivery_apartment}` : ''}
${order.delivery_city}, ${order.delivery_state} ${order.delivery_zip_code}
Phone: ${order.delivery_phone}
${order.delivery_instructions ? `Instructions: ${order.delivery_instructions}` : ''}

Estimated Delivery: Within 2-4 hours

ORDER SUMMARY:
Subtotal: ${formatCurrency(order.subtotal)}
Tax: ${formatCurrency(order.tax_amount)}
Delivery Fee: ${formatCurrency(order.delivery_fee)}
Total: ${formatCurrency(order.total_amount)}

IMPORTANT REMINDERS:
- Payment is cash on delivery - please have exact change ready
- Valid ID required - must be 21+ years old
- Tip suggestions: 15% (${formatCurrency(order.total_amount * 0.15)}), 18% (${formatCurrency(order.total_amount * 0.18)}), 20% (${formatCurrency(order.total_amount * 0.2)})
- Please be available at the delivery address during the estimated time

NEED HELP?
Call or Text: (763) 247-5378
Email: support@dankdealsmn.com

© 2025 DankDeals MN. All rights reserved.
This email contains information about cannabis products. Must be 21+ to receive.
`;
};

async function getOrderDetails(orderNumber) {
  console.log(`Fetching order details for: ${orderNumber}`);

  const { data: order, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items (
        *,
        products (name, category)
      )
    `
    )
    .eq('order_number', orderNumber)
    .single();

  if (error || !order) {
    throw new Error(`Order not found: ${orderNumber}`);
  }

  return order;
}

async function sendOrderConfirmation(orderNumber) {
  try {
    // Fetch order details from database
    const order = await getOrderDetails(orderNumber);
    console.log(`Found order for: ${order.delivery_first_name} ${order.delivery_last_name}`);

    // Determine recipient email
    let recipientEmail = order.delivery_email;

    // If no delivery_email, try to extract from notes (for guest orders)
    if (!recipientEmail && order.notes) {
      const emailMatch = order.notes.match(/Email:\s*([^\s,]+)/);
      if (emailMatch) {
        recipientEmail = emailMatch[1];
      }
    }

    if (!recipientEmail) {
      throw new Error('No email address found for this order');
    }

    console.log(`Sending confirmation email to: ${recipientEmail}`);

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'DankDeals MN <orders@dankdealsmn.com>',
      to: [recipientEmail],
      subject: `Order Confirmation #${order.order_number} - DankDeals MN`,
      html: createOrderConfirmationHTML(order),
      text: createOrderConfirmationText(order),
      tags: [
        { name: 'category', value: 'order_confirmation' },
        { name: 'order_id', value: order.id },
        { name: 'order_number', value: order.order_number },
      ],
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('✅ Order confirmation email sent successfully!');
    console.log(`Email ID: ${data.id}`);
    console.log(`Recipient: ${recipientEmail}`);
    console.log(`Order: #${order.order_number}`);
    console.log(`Total: $${Number(order.total_amount).toFixed(2)}`);

    // Log the email sending event
    await supabase.from('email_logs').insert({
      email_id: data.id,
      event_type: 'email.sent',
      to_email: recipientEmail,
      from_email: 'orders@dankdealsmn.com',
      subject: `Order Confirmation #${order.order_number} - DankDeals MN`,
      event_data: {
        order_id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
      },
    });

    return data;
  } catch (error) {
    console.error('❌ Error sending order confirmation:', error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const orderNumber = process.argv[2];

  if (!orderNumber) {
    console.error('Usage: node scripts/send-order-confirmation.js ORDER_NUMBER');
    console.error('Example: node scripts/send-order-confirmation.js 20250715-0001');
    process.exit(1);
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('Error: RESEND_API_KEY environment variable is required');
    process.exit(1);
  }

  await sendOrderConfirmation(orderNumber);
}

// Run the script
main().catch(console.error);
