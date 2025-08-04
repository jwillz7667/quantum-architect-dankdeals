import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkStock() {
  const { data: product } = await supabase
    .from('products')
    .select('id, name, stock_quantity')
    .eq('id', '33333333-3333-3333-3333-333333333333')
    .single();

  console.log('Product:', product);

  // Update stock to allow testing
  const { error } = await supabase
    .from('products')
    .update({ stock_quantity: 100 })
    .eq('id', '33333333-3333-3333-3333-333333333333');

  if (error) {
    console.error('Failed to update stock:', error);
  } else {
    console.log('Updated stock to 100');
  }
}

checkStock();
