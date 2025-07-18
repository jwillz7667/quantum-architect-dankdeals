import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function testAdminEmail() {
  try {
    // Use a test order ID or create a test order
    const testOrderId = process.argv[2];

    if (!testOrderId) {
      console.error('Please provide an order ID as argument');
      console.log('Usage: node scripts/test-admin-email.js <order-id>');
      process.exit(1);
    }

    console.log('Testing admin email for order:', testOrderId);
    console.log('Edge function URL:', `${SUPABASE_URL}/functions/v1/send-order-emails`);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-order-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ orderId: testOrderId }),
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
      console.error('Failed to send emails');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testAdminEmail();
