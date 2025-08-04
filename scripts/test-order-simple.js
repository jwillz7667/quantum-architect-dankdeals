#!/usr/bin/env node

import { config } from 'dotenv';
config();

async function testProcessOrder() {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  const testOrderData = {
    customer_name: 'Test User',
    customer_email: 'test@example.com',
    customer_phone: '612-555-1234',
    delivery_first_name: 'Test',
    delivery_last_name: 'User',
    delivery_address: {
      street: '123 Test Street',
      apartment: 'Suite 100',
      city: 'Minneapolis',
      state: 'MN',
      zipcode: '55401',
      instructions: 'Ring doorbell twice',
    },
    items: [
      {
        product_id: '33333333-3333-3333-3333-333333333333', // Runtz product
        name: 'Runtz',
        price: 60,
        quantity: 2,
        weight: 3.5,
      },
    ],
    subtotal: 120,
    tax: 9.93,
    delivery_fee: 10,
    total: 139.93,
    payment_method: 'cash',
  };

  console.log('Testing process-order edge function...');
  console.log('URL:', `${SUPABASE_URL}/functions/v1/process-order`);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/process-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(testOrderData),
    });

    const responseText = await response.text();
    console.log('\nResponse Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    try {
      const data = JSON.parse(responseText);
      console.log('\nResponse Body:', JSON.stringify(data, null, 2));

      if (data.success) {
        console.log('\n✅ Order created successfully!');
        console.log('Order ID:', data.order.id);
        console.log('Order Number:', data.order.order_number);
      } else {
        console.log('\n❌ Order failed:', data.error);
        if (data.details) {
          console.log('Details:', data.details);
        }
      }
    } catch (e) {
      console.log('\nResponse Text:', responseText);
    }
  } catch (error) {
    console.error('\nFetch Error:', error);
  }
}

testProcessOrder();
