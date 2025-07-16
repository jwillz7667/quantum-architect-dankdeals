#!/usr/bin/env node

// Test script for order confirmation email edge function
// Usage: node scripts/test-email-function.js <order-id>

// Use built-in fetch in Node.js 18+

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

async function testEmailFunction(orderId) {
  if (!orderId) {
    console.error('Please provide an order ID as argument');
    console.log('Usage: node scripts/test-email-function.js <order-id>');
    process.exit(1);
  }

  console.log(`Testing email function with order ID: ${orderId}`);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-order-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ orderId }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Email function called successfully');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Email function failed');
      console.error('Status:', response.status);
      console.error('Response:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Error calling email function:', error);
  }
}

// Run test
const orderId = process.argv[2];
testEmailFunction(orderId);
