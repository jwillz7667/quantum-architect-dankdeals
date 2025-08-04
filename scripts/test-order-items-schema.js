import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

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
