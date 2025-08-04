#!/usr/bin/env node

import { config } from 'dotenv';
config();

// Check Resend domain status
async function checkResendDomain() {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY environment variable. Please check your .env file.');
    process.exit(1);
  }

  console.log('Checking Resend domain status...\n');

  try {
    // Check domains
    const domainsResponse = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
    });

    const domains = await domainsResponse.json();
    console.log('Domains:', JSON.stringify(domains, null, 2));

    // Check API keys
    const keysResponse = await fetch('https://api.resend.com/api-keys', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
    });

    const keys = await keysResponse.json();
    console.log('\nAPI Keys:', JSON.stringify(keys, null, 2));
  } catch (error) {
    console.error('\nError:', error);
  }
}

checkResendDomain();
