import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');

  try {
    // Check user_preferences table structure
    const { data: prefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .limit(1);

    if (prefsError) {
      console.error('❌ Error accessing user_preferences:', prefsError.message);
    } else {
      console.log('✅ user_preferences table accessible');
      if (prefs && prefs.length > 0) {
        console.log('📋 Sample record structure:', Object.keys(prefs[0]));
      } else {
        console.log('ℹ️ No records in user_preferences table');
      }
    }

    // Try inserting a test record to see what fields are expected
    const { data: testUser } = await supabase.from('profiles').select('id').limit(1);

    if (testUser && testUser.length > 0) {
      const userId = testUser[0].id;

      // Try a minimal insert
      const { error: insertError } = await supabase.from('user_preferences').insert([
        {
          user_id: userId,
          communication_preferences: { test: true },
          favorite_categories: ['test'],
        },
      ]);

      if (insertError) {
        console.log('❌ Insert error (this helps us understand the schema):', insertError.message);
      } else {
        console.log('✅ Test insert successful');

        // Clean up
        await supabase.from('user_preferences').delete().eq('user_id', userId);
      }
    }
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkSchema()
  .then(() => {
    console.log('\n✅ Schema check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Schema check failed:', error);
    process.exit(1);
  });
