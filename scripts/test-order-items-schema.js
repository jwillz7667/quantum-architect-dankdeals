import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ralbzuvkyexortqngvxs.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbGJ6dXZreWV4b3J0cW5ndnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTk3NzEsImV4cCI6MjA2Njk3NTc3MX0.QRWwsrZGHY4HLFOlRpygtJDDd1DAJ2rBwDOt1e1m-sA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking order_items table schema...');

  // Try to insert a dummy order item with all fields to see which columns are missing
  const testData = {
    order_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
    product_id: '00000000-0000-0000-0000-000000000000',
    quantity: 1,
    unit_price: 10.0,
    total_price: 10.0,
    product_name: 'Test Product',
    product_description: 'Test Description',
    product_category: 'Test Category',
    product_strain_type: 'Test Strain',
    product_thc_percentage: 20.0,
    product_cbd_percentage: 1.0,
  };

  const { data, error } = await supabase.from('order_items').insert(testData);

  if (error) {
    console.error('Error details:', error);
    if (error.message.includes('column')) {
      console.log('\nMissing columns detected in error message.');
    }
  } else {
    console.log('All columns exist! Cleaning up test data...');
    // Clean up - this won't actually work due to foreign key constraints, but that's ok
    await supabase.from('order_items').delete().eq('order_id', testData.order_id);
  }

  // Also try to select from order_items to see structure
  const { data: sample, error: selectError } = await supabase
    .from('order_items')
    .select('*')
    .limit(1);

  if (!selectError && sample && sample.length > 0) {
    console.log('\nExisting columns in order_items:', Object.keys(sample[0]));
  }
}

checkSchema().catch(console.error);
