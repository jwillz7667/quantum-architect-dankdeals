#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

async function manualSendEmail() {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  const EMAIL_ID = 'd91f30c2-af05-4253-a631-f1f0a93bc29a';

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('Manually sending email...\n');

  try {
    // Get the email
    const { data: email } = await supabase
      .from('email_queue')
      .select('*')
      .eq('id', EMAIL_ID)
      .single();

    // Get the order with items
    const { data: order } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          *,
          products (
            name,
            category
          )
        )
      `
      )
      .eq('id', email.data.orderId)
      .single();

    console.log('Sending to:', email.to_email);
    console.log('Order:', order.order_number);

    // Send customer email
    const customerEmail = {
      from: 'DankDeals <orders@dankdealsmn.com>',
      to: email.to_email,
      subject: `Order Confirmed - ${order.order_number}`,
      html: `
        <h1>Order Confirmation</h1>
        <p>Thank you for your order!</p>
        <p><strong>Order Number:</strong> ${order.order_number}</p>
        <p><strong>Total:</strong> $${order.total_amount.toFixed(2)}</p>
        <h3>Items:</h3>
        <ul>
          ${order.order_items
            .map(
              (item) => `
            <li>${item.quantity}x ${item.product_name} - $${item.total_price.toFixed(2)}</li>
          `
            )
            .join('')}
        </ul>
        <p>We'll send you updates as your order is prepared.</p>
      `,
    };

    const response1 = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(customerEmail),
    });

    const result1 = await response1.json();
    console.log('Customer email:', response1.ok ? '✅ Sent' : '❌ Failed', result1);

    // Send admin email
    const adminEmail = {
      from: 'DankDeals Orders <orders@dankdealsmn.com>',
      to: 'admin@dankdealsmn.com',
      subject: `🚨 NEW ORDER - ${order.order_number} - $${order.total_amount.toFixed(2)}`,
      html: `
        <h1>New Order Received!</h1>
        <p><strong>Order Number:</strong> ${order.order_number}</p>
        <p><strong>Customer:</strong> ${order.delivery_first_name} ${order.delivery_last_name}</p>
        <p><strong>Phone:</strong> ${order.customer_phone_number}</p>
        <p><strong>Email:</strong> ${order.customer_email}</p>
        <p><strong>Total:</strong> $${order.total_amount.toFixed(2)}</p>
        <h3>Delivery Address:</h3>
        <p>${order.delivery_street_address}${order.delivery_apartment ? ', ' + order.delivery_apartment : ''}<br>
        ${order.delivery_city}, ${order.delivery_state} ${order.delivery_zip_code}</p>
        <h3>Items:</h3>
        <ul>
          ${order.order_items
            .map(
              (item) => `
            <li>${item.quantity}x ${item.product_name} - $${item.total_price.toFixed(2)}</li>
          `
            )
            .join('')}
        </ul>
        ${order.delivery_instructions ? `<p><strong>Delivery Instructions:</strong> ${order.delivery_instructions}</p>` : ''}
      `,
    };

    const response2 = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(adminEmail),
    });

    const result2 = await response2.json();
    console.log('Admin email:', response2.ok ? '✅ Sent' : '❌ Failed', result2);

    if (response1.ok) {
      // Mark as sent
      await supabase
        .from('email_queue')
        .update({ status: 'sent', completed_at: new Date().toISOString() })
        .eq('id', EMAIL_ID);
      console.log('\nEmail marked as sent in queue');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

manualSendEmail();
