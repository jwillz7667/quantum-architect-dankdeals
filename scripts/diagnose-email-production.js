#!/usr/bin/env node

// Production email diagnostic script
// Usage: node scripts/diagnose-email-production.js <order-number>

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://ralbzuvkyexortqngvxs.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbGJ6dXZreWV4b3J0cW5ndnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTk3NzEsImV4cCI6MjA2Njk3NTc3MX0.QRWwsrZGHY4HLFOlRpygtJDDd1DAJ2rBwDOt1e1m-sA';

async function diagnoseEmailProduction(orderId) {
  if (!orderId) {
    console.error('Please provide an order ID/number as argument');
    console.log('Usage: node scripts/diagnose-email-production.js <order-id>');
    process.exit(1);
  }

  console.log('🔍 Diagnosing production email issue...');
  console.log(`📋 Order ID: ${orderId}`);
  console.log(`🌐 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
  console.log('');

  // Test 1: Check if order exists
  console.log('1️⃣ Testing order lookup...');
  try {
    // Check if it's a UUID format or order number
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    const filter = isUUID ? `id.eq.${orderId}` : `order_number.eq.${orderId}`;

    const orderResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?select=id,order_number,user_id,delivery_first_name,created_at&${filter}&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!orderResponse.ok) {
      console.error('❌ Order lookup failed:', orderResponse.status, await orderResponse.text());
      return;
    }

    const orders = await orderResponse.json();
    if (orders.length === 0) {
      console.error('❌ Order not found');
      return;
    }

    const order = orders[0];
    console.log('✅ Order found:', order);
    console.log('');

    // Test 2: Check edge function directly
    console.log('2️⃣ Testing edge function direct call...');
    const edgeFunctionResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-order-emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId }),
    });

    console.log('📊 Edge function response status:', edgeFunctionResponse.status);
    const edgeFunctionResult = await edgeFunctionResponse.json();
    console.log('📋 Edge function result:', edgeFunctionResult);
    console.log('');

    // Test 3: Check if there are any CORS issues
    console.log('3️⃣ Testing CORS preflight...');
    const corsResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-order-emails`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://dankdealsmn.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,content-type',
      },
    });

    console.log('📊 CORS preflight status:', corsResponse.status);
    console.log('📋 CORS headers:', Object.fromEntries(corsResponse.headers.entries()));
    console.log('');

    // Test 4: Check Supabase client simulation
    console.log('4️⃣ Testing Supabase client simulation...');
    try {
      const clientResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-order-emails`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'x-client-info': 'supabase-js/2.39.0',
        },
        body: JSON.stringify({ orderId }),
      });

      console.log('📊 Client simulation status:', clientResponse.status);
      const clientResult = await clientResponse.json();
      console.log('📋 Client simulation result:', clientResult);
    } catch (error) {
      console.error('❌ Client simulation failed:', error.message);
    }

    // Summary
    console.log('');
    console.log('📊 DIAGNOSIS SUMMARY:');
    console.log('===================');

    if (edgeFunctionResponse.ok) {
      console.log('✅ Edge function is working correctly');
      console.log('🔍 Issue is likely in the frontend client configuration');
      console.log('');
      console.log('🛠️ Recommended fixes:');
      console.log('1. Check Netlify environment variables');
      console.log('2. Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in production');
      console.log('3. Check browser console for client-side errors');
      console.log('4. Verify order service is calling the email function correctly');
    } else {
      console.log('❌ Edge function has issues');
      console.log('🔍 Check edge function logs and configuration');
    }
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}

// Run diagnostic
const orderId = process.argv[2];
diagnoseEmailProduction(orderId);
