#!/usr/bin/env node

import { config } from 'dotenv';
config();

async function testEmailDebug() {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  console.log('Testing email send from edge function...');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/test-email-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ to: 'test@example.com' }),
    });

    const data = await response.json();
    console.log('\nResponse:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('\nError:', error);
  }
}

testEmailDebug();
