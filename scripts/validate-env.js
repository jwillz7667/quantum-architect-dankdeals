#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

const optionalEnvVars = [
  'VITE_GOOGLE_CLIENT_ID',
  'VITE_GA_MEASUREMENT_ID',
  'VITE_VERCEL_ANALYTICS_ID',
  'CDN_URL',
];

function validateEnv() {
  console.log('🔍 Validating environment variables...\n');

  const missing = [];
  const warnings = [];

  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check optional variables
  for (const varName of optionalEnvVars) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }

  // Check for .env file
  const envPath = join(process.cwd(), '.env');
  const envLocalPath = join(process.cwd(), '.env.local');

  if (!existsSync(envPath) && !existsSync(envLocalPath)) {
    console.warn('⚠️  No .env or .env.local file found. Using environment variables.\n');
  }

  // Report missing required variables
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((v) => console.error(`   - ${v}`));
    console.error('\nPlease set these variables in your .env file or environment.');
    console.error('See .env.example for reference.\n');
    process.exit(1);
  }

  // Report optional variables
  if (warnings.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Missing optional environment variables:');
    warnings.forEach((v) => console.warn(`   - ${v}`));
    console.warn('\nThese features will be disabled.\n');
  }

  // Validate Supabase URL format
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
    console.warn(
      '⚠️  VITE_SUPABASE_URL might be invalid. Expected format: https://[project].supabase.co\n'
    );
  }

  console.log('✅ Environment validation passed!\n');
}

// Run validation
validateEnv();
