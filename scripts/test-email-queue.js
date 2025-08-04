import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testEmailQueue() {
  console.log('Testing email queue insertion...\n');

  const testEmail = {
    type: 'ORDER_CONFIRMATION',
    to: 'test@example.com',
    subject: 'Test Order Confirmation',
    data: { orderId: 'test-order-123' },
    priority: 'high',
    status: 'pending',
    attempts: 0,
    scheduled_at: new Date().toISOString(),
  };

  console.log('Inserting test email:', testEmail);

  const { data, error } = await supabase.from('email_queue').insert(testEmail).select();

  if (error) {
    console.error('\n❌ Failed to insert email:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  } else {
    console.log('\n✅ Email queued successfully:', data);
  }

  // Check what columns exist
  console.log('\n\nChecking email_queue table structure...');
  const { data: columns, error: schemaError } = await supabase
    .rpc('get_table_columns', { table_name: 'email_queue' })
    .catch(() => ({ data: null, error: 'RPC not available' }));

  if (columns) {
    console.log('Columns:', columns);
  } else {
    // Try a different approach
    const { data: sample, error: sampleError } = await supabase
      .from('email_queue')
      .select('*')
      .limit(1);

    if (!sampleError && sample) {
      console.log('Sample row columns:', Object.keys(sample[0] || {}));
    }
  }
}

testEmailQueue();
