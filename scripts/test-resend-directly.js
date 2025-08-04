#!/usr/bin/env node

import { config } from 'dotenv';
config();

// Test Resend API directly
async function testResend() {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY environment variable. Please check your .env file.');
    process.exit(1);
  }
  const FROM_EMAIL = 'orders@dankdealsmn.com';
  const TEST_EMAIL = 'test@example.com'; // Change this to your email for testing

  console.log('Testing Resend API directly...\n');

  const emailData = {
    from: `DankDeals <${FROM_EMAIL}>`,
    to: TEST_EMAIL,
    subject: 'Test Email - Direct Resend API',
    html: `
      <h1>Test Email</h1>
      <p>This is a test email sent directly through the Resend API.</p>
      <p>Time: ${new Date().toISOString()}</p>
    `,
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailData),
    });

    const responseText = await response.text();
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    try {
      const data = JSON.parse(responseText);
      console.log('\nResponse:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('\nResponse Text:', responseText);
    }

    if (!response.ok) {
      console.log('\n❌ Email send failed');
    } else {
      console.log('\n✅ Email sent successfully!');
    }
  } catch (error) {
    console.error('\nError:', error);
  }
}

testResend();
