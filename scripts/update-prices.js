import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client with service role key
// Use original Supabase URL for database operations
const supabaseUrl = 'https://ralbzuvkyexortqngvxs.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updatePrices() {
  console.log('Updating product prices...');

  try {
    // Read the SQL file
    const sqlPath = join(__dirname, 'update-product-prices.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If RPC doesn't exist, update manually
      console.log('Using direct update method...');

      // Update all variants with new prices
      const updates = [
        { name: '1/8 oz (3.5g)', price: 40.0 },
        { name: '1/4 oz (7g)', price: 75.0 },
        { name: '1/2 oz (14g)', price: 140.0 },
        { name: '1 oz (28g)', price: 250.0 },
      ];

      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('product_variants')
          .update({ price: update.price })
          .eq('name', update.name);

        if (updateError) {
          console.error(`Error updating ${update.name}:`, updateError);
        } else {
          console.log(`✅ Updated ${update.name} to $${update.price}`);
        }
      }
    }

    // Verify the updates
    const { data: variants, error: fetchError } = await supabase
      .from('product_variants')
      .select('name, price')
      .order('name');

    if (fetchError) {
      console.error('Error fetching variants:', fetchError);
    } else {
      console.log('\nCurrent prices:');
      variants.forEach((v) => {
        console.log(`${v.name}: $${v.price}`);
      });
    }

    console.log('\n✅ Price update complete!');
  } catch (error) {
    console.error('Error updating prices:', error);
    process.exit(1);
  }
}

updatePrices();
