#!/usr/bin/env node

/**
 * Test script to verify email function fixes work correctly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testEmailFunction() {
  console.log('🧪 Testing email function fixes...\n');

  try {
    // First, let's see what orders exist
    console.log('📋 Fetching recent orders...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, created_at, notes, delivery_first_name, delivery_last_name')
      .order('created_at', { ascending: false })
      .limit(5);

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('⚠️ No orders found in database');
      return;
    }

    console.log(`✅ Found ${orders.length} recent orders:`);
    orders.forEach((order, index) => {
      console.log(
        `${index + 1}. Order ${order.order_number} - ${order.delivery_first_name} ${order.delivery_last_name}`
      );
      if (order.notes) {
        const emailMatch = order.notes.match(/Email:\s*([^,\s]+)/i);
        console.log(`   Email extracted: ${emailMatch ? emailMatch[1] : 'Not found'}`);
      }
    });

    // Test with the most recent order
    const testOrder = orders[0];
    console.log(`\n🚀 Testing email function with order: ${testOrder.order_number}`);

    const response = await supabase.functions.invoke('send-order-emails', {
      body: { orderId: testOrder.id },
    });

    if (response.error) {
      console.error('❌ Email function error:', response.error);
    } else {
      console.log('✅ Email function response:', response.data);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEmailFunction();
