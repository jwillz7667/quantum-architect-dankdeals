#!/usr/bin/env node

/**
 * Check for API keys and sensitive values before build
 * Prevents accidental exposure of secrets in production builds
 */

const GOOGLE_MAPS_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;
const isProduction = process.env.NODE_ENV === 'production';
const isNetlify = process.env.NETLIFY === 'true';

// Check Google Maps API key
if (GOOGLE_MAPS_KEY && isProduction) {
  // Check if it's a real API key pattern
  if (GOOGLE_MAPS_KEY.startsWith('AIza') && GOOGLE_MAPS_KEY !== 'your_google_maps_api_key') {
    console.warn('\n⚠️  WARNING: Google Maps API key detected in production build');
    console.warn('   This may trigger Netlify secrets scanning.');

    if (isNetlify) {
      console.warn('   Consider setting VITE_GOOGLE_MAPS_API_KEY=DISABLED_FOR_SECURITY');
      console.warn('   Or add SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES="AIza*" to netlify.toml\n');
    }
  }
}

// Check for other sensitive patterns
const sensitivePatterns = [
  { name: 'AWS Keys', pattern: /AKIA[0-9A-Z]{16}/, env: 'AWS' },
  { name: 'Private Keys', pattern: /-----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/, env: 'KEY' },
  {
    name: 'Generic API Keys',
    pattern: /api[_-]?key[_-]?=["']?[a-zA-Z0-9]{32,}["']?/i,
    env: 'API_KEY',
  },
];

Object.entries(process.env).forEach(([key, value]) => {
  if (!value || !key.startsWith('VITE_')) return;

  sensitivePatterns.forEach(({ name, pattern }) => {
    if (pattern.test(value)) {
      console.error(`\n❌ ERROR: ${name} pattern detected in ${key}`);
      console.error('   Remove this value before building for production\n');
      process.exit(1);
    }
  });
});

console.log('✅ API key check passed');
