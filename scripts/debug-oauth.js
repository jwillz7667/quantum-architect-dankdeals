// Debug OAuth Configuration
console.log('OAuth Debug Information:');
console.log('========================');

// When running on production
if (window.location.hostname === 'dankdealsmn.com') {
  console.log('Current Origin:', window.location.origin);
  console.log('Expected Callback URL:', `${window.location.origin}/auth/callback`);
  console.log('');
  console.log('Make sure these URLs are in Google Cloud Console:');
  console.log('1. Authorized JavaScript Origins:');
  console.log('   - https://dankdealsmn.com');
  console.log('   - https://auth.dankdealsmn.com');
  console.log('');
  console.log('2. Authorized Redirect URIs:');
  console.log('   - https://auth.dankdealsmn.com/auth/v1/callback');
  console.log('');
  console.log('In Supabase Dashboard (Authentication > Settings):');
  console.log('- Site URL: https://dankdealsmn.com');
  console.log('- Additional Redirect URLs: https://dankdealsmn.com/auth/callback');
}

// Check environment
console.log('');
console.log('Environment Variables:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
