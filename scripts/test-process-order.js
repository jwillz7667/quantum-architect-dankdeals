import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function testProcessOrder() {
  try {
    console.log('Testing process-order edge function...');
    console.log('Edge function URL:', `${SUPABASE_URL}/functions/v1/process-order`);

    // Test order data
    const testOrderData = {
      customer_email: 'test@example.com',
      customer_phone: '555-1234',
      delivery_first_name: 'Test',
      delivery_last_name: 'User',
      delivery_address: {
        street: '123 Test St',
        apartment: 'Apt 4',
        city: 'Minneapolis',
        state: 'MN',
        zipcode: '55401',
        instructions: 'Test delivery instructions',
      },
      items: [
        {
          product_id: 'test-product-1',
          name: 'Test Product',
          price: 25.0,
          quantity: 2,
          weight: 3.5,
        },
      ],
      subtotal: 50.0,
      tax: 5.0,
      delivery_fee: 10.0,
      total: 65.0,
      payment_method: 'cash',
    };

    const response = await fetch(`${SUPABASE_URL}/functions/v1/process-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(testOrderData),
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    try {
      const data = JSON.parse(responseText);
      console.log('Response data:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Response text:', responseText);
    }

    if (!response.ok) {
      console.error('Failed to process order');
    } else {
      console.log('Order processed successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testProcessOrder();
