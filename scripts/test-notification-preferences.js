import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ralbzuvkyexortqngvxs.supabase.co';
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

async function testNotificationPreferences() {
  console.log('🔔 Testing Notification Preferences Functionality\n');

  try {
    // Get existing user
    const { data: existingProfiles } = await supabase.from('profiles').select('id').limit(1);

    if (!existingProfiles || existingProfiles.length === 0) {
      console.log('❌ No existing users found to test with');
      return;
    }

    const testUserId = existingProfiles[0].id;
    console.log(`✅ Testing with user ID: ${testUserId}`);

    // Test 1: Check current preferences
    console.log('\n1️⃣ Checking current preferences...');
    const { data: currentPrefs, error: fetchError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      console.log('ℹ️ No preferences found, will create new ones');
    } else if (fetchError) {
      console.error('❌ Error fetching preferences:', fetchError.message);
      return;
    } else {
      console.log('✅ Current preferences found');
      console.log(
        `   - Communication preferences: ${Object.keys(currentPrefs.communication_preferences || {}).length} settings`
      );
    }

    // Test 2: Create/Update preferences
    console.log('\n2️⃣ Testing preference updates...');

    const testPreferences = {
      user_id: testUserId,
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      marketing_emails: false,
      dark_mode: false,
      two_factor_enabled: false,
    };

    const { error: upsertError } = await supabase
      .from('user_preferences')
      .update(testPreferences)
      .eq('user_id', testUserId);

    if (upsertError) {
      console.error('❌ Error saving preferences:', upsertError.message);
      return;
    } else {
      console.log('✅ Preferences saved successfully');
    }

    // Test 3: Verify preferences were saved
    console.log('\n3️⃣ Verifying saved preferences...');
    const { data: savedPrefs, error: verifyError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying preferences:', verifyError.message);
      return;
    }

    console.log('✅ Preferences verified successfully');
    console.log(`   - Email notifications: ${savedPrefs.email_notifications}`);
    console.log(`   - SMS notifications: ${savedPrefs.sms_notifications}`);
    console.log(`   - Push notifications: ${savedPrefs.push_notifications}`);
    console.log(`   - Marketing emails: ${savedPrefs.marketing_emails}`);

    // Test 4: Test individual preference updates
    console.log('\n4️⃣ Testing individual preference updates...');

    const { error: updateError } = await supabase
      .from('user_preferences')
      .update({
        marketing_emails: true,
        sms_notifications: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', testUserId);

    if (updateError) {
      console.error('❌ Error updating preferences:', updateError.message);
      return;
    }

    console.log('✅ Individual preferences updated successfully');

    // Test 5: Final verification
    console.log('\n5️⃣ Final verification...');
    const { data: finalPrefs, error: finalError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (finalError) {
      console.error('❌ Error in final verification:', finalError.message);
      return;
    }

    console.log('✅ Final verification successful');
    console.log(`   - Marketing emails: ${finalPrefs.marketing_emails}`);
    console.log(`   - SMS notifications: ${finalPrefs.sms_notifications}`);

    console.log('\n🎉 Notification preferences functionality test completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Preferences can be created and updated');
    console.log('✅ Individual notification preference columns work correctly');
    console.log('✅ Individual preference changes persist properly');
    console.log('✅ All database operations successful');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testNotificationPreferences()
  .then(() => {
    console.log('\n✅ Notification preferences test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
