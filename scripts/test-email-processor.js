#!/usr/bin/env node

import { config } from 'dotenv';
config();

async function testEmailProcessor() {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  console.log('Testing email processor...');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/process-email-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action: 'process' }),
    });

    const responseText = await response.text();
    console.log('\nResponse Status:', response.status);

    try {
      const data = JSON.parse(responseText);
      console.log('\nResponse:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('\nResponse Text:', responseText);
    }
  } catch (error) {
    console.error('\nError:', error);
  }
}

testEmailProcessor();
