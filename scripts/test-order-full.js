#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testOrderProcessing() {
  console.log('🚀 Starting order processing test...\n');

  try {
    // 1. Get a real product ID for testing
    console.log('1️⃣  Fetching a product for testing...');
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name, price, category')
      .eq('is_active', true)
      .limit(1);

    if (productError || !products?.length) {
      console.error('❌ Failed to fetch product:', productError);
      return;
    }

    const testProduct = products[0];
    console.log('✅ Found product:', testProduct.name, `($${testProduct.price})`);

    // 2. Prepare test order data
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
          product_id: testProduct.id,
          name: testProduct.name,
          price: testProduct.price,
          quantity: 2,
          weight: 3.5,
        },
      ],
      subtotal: testProduct.price * 2,
      tax: testProduct.price * 2 * 0.08275, // MN tax rate
      delivery_fee: 10.0,
      total: testProduct.price * 2 + testProduct.price * 2 * 0.08275 + 10.0,
      payment_method: 'cash',
    };

    console.log('\n2️⃣  Creating order with data:');
    console.log(JSON.stringify(testOrderData, null, 2));

    // 3. Call the process-order function
    console.log('\n3️⃣  Calling process-order edge function...');
    const { data: orderResponse, error: orderError } = await supabase.functions.invoke(
      'process-order',
      {
        body: testOrderData,
      }
    );

    if (orderError) {
      console.error('❌ Order creation failed:', orderError);
      // Try to get more details from the response
      if (orderError.context?.body) {
        try {
          const errorBody = await orderError.context.json();
          console.error('   Error details:', errorBody);
        } catch (e) {
          // Body already consumed or not JSON
        }
      }
      return;
    }

    if (!orderResponse?.success) {
      console.error('❌ Order creation failed:', orderResponse?.error || 'Unknown error');
      return;
    }

    console.log('✅ Order created successfully!');
    console.log('   Order ID:', orderResponse.order.id);
    console.log('   Order Number:', orderResponse.order.order_number);
    console.log('   Total:', `$${orderResponse.order.total}`);

    // 4. Verify order in database
    console.log('\n4️⃣  Verifying order in database...');
    const { data: savedOrder, error: fetchError } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items (*)
      `
      )
      .eq('id', orderResponse.order.id)
      .single();

    if (fetchError || !savedOrder) {
      console.error('❌ Failed to fetch order from database:', fetchError);
      return;
    }

    console.log('✅ Order verified in database:');
    console.log('   Status:', savedOrder.status);
    console.log('   Items:', savedOrder.order_items.length);
    console.log('   Payment Method:', savedOrder.payment_method);

    // 5. Check email queue
    console.log('\n5️⃣  Checking email queue...');
    const { data: emailJobs, error: emailError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('data->>orderId', orderResponse.order.id);

    if (emailError) {
      console.error('❌ Failed to check email queue:', emailError);
      return;
    }

    if (emailJobs && emailJobs.length > 0) {
      console.log('✅ Email queued successfully:');
      emailJobs.forEach((job) => {
        console.log(`   Type: ${job.type}`);
        console.log(`   To: ${job.to || job.to_email}`);
        console.log(`   Status: ${job.status}`);
        console.log(`   Priority: ${job.priority}`);
      });
    } else {
      console.log('⚠️  No emails found in queue (might have been sent already)');
    }

    // 6. Check order processing logs
    console.log('\n6️⃣  Checking order processing logs...');
    const { data: logs, error: logsError } = await supabase
      .from('order_processing_logs')
      .select('*')
      .eq('order_id', orderResponse.order.id)
      .order('created_at', { ascending: true });

    if (!logsError && logs && logs.length > 0) {
      console.log('✅ Order processing logs:');
      logs.forEach((log) => {
        console.log(`   ${log.action}: ${log.status} (${log.duration_ms || 0}ms)`);
      });
    }

    // 7. Test health check again
    console.log('\n7️⃣  Checking system health after order...');
    const { data: healthData } = await supabase.functions.invoke('health-check');

    if (healthData?.healthy) {
      console.log('✅ System health check passed');
      console.log('   Orders today:', healthData.metrics?.ordersToday || 0);
      console.log('   Pending emails:', healthData.metrics?.pendingEmails || 0);
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('🎉 The order processing system is working correctly!\n');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error(error.stack);
  }
}

// Run the test
testOrderProcessing();
