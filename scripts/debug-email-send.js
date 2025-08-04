#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

async function debugEmailSend() {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!SUPABASE_SERVICE_KEY) {
    console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('Debug email sending process...\n');

  try {
    // Get a stuck email
    const { data: email, error: emailError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'processing')
      .limit(1)
      .single();

    if (emailError || !email) {
      console.error('Error fetching email:', emailError);
      return;
    }

    console.log('Processing email:', {
      id: email.id,
      type: email.email_type,
      to: email.to_email,
      data: email.data,
    });

    // Get the order
    const orderId = email.data?.orderId;
    if (!orderId) {
      console.error('No orderId in email data');
      return;
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `
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
      `
      )
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return;
    }

    console.log('\nOrder found:', {
      id: order.id,
      order_number: order.order_number,
      customer_email: order.customer_email,
      total: order.total_amount,
      items: order.order_items?.length || 0,
    });

    // Try to send email directly
    console.log('\nSending email via Resend...');

    const emailData = {
      from: 'DankDeals <orders@dankdealsmn.com>',
      to: email.to_email,
      subject: `Order Confirmed - ${order.order_number}`,
      html: `
        <h1>Order Confirmation</h1>
        <p>Thank you for your order!</p>
        <p>Order Number: ${order.order_number}</p>
        <p>Total: $${order.total_amount.toFixed(2)}</p>
        <p>Items: ${order.order_items?.length || 0}</p>
      `,
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();
    console.log('Resend response:', result);

    if (response.ok) {
      // Mark email as completed
      const { error: updateError } = await supabase
        .from('email_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', email.id);

      if (updateError) {
        console.error('Error updating email status:', updateError);
      } else {
        console.log('\n✅ Email sent and marked as completed!');
      }
    } else {
      console.error('\n❌ Email send failed');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

debugEmailSend();
