// Use native fetch in Node.js 18+
import dotenv from 'dotenv';

dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jwillz7667@gmail.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'orders@dankdealsmn.com';

async function testResendDirect() {
  try {
    console.log('Testing Resend API directly...');
    console.log('ADMIN_EMAIL:', ADMIN_EMAIL);
    console.log('FROM_EMAIL:', FROM_EMAIL);
    console.log('RESEND_API_KEY:', RESEND_API_KEY ? 'Set' : 'Missing');

    const payload = {
      from: `DankDeals Orders <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `TEST - Admin Email Test ${new Date().toISOString()}`,
      html: `
        <h1>Test Admin Email</h1>
        <p>This is a test email sent directly to the admin.</p>
        <p>If you receive this, the Resend API is working correctly.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
    };

    console.log('\nSending email with payload:');
    console.log(JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('\nResponse status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    try {
      const data = JSON.parse(responseText);
      console.log('Response data:', JSON.stringify(data, null, 2));

      if (data.id) {
        console.log('\n✅ Email sent successfully!');
        console.log('Email ID:', data.id);
      }
    } catch (e) {
      console.log('Response text:', responseText);
    }

    if (!response.ok) {
      console.error('\n❌ Failed to send email');

      // Parse common Resend errors
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.name === 'validation_error') {
          console.error('Validation error:', errorData.message);
          if (errorData.errors) {
            console.error('Specific errors:', errorData.errors);
          }
        }
      } catch (e) {}
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Also test sending to a different email
async function testAlternativeEmail() {
  const alternativeEmail = process.argv[2];
  if (alternativeEmail) {
    console.log('\n\n=== Testing with alternative email ===');
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    const payload = {
      from: `DankDeals Orders <${FROM_EMAIL}>`,
      to: alternativeEmail,
      subject: `TEST - Alternative Email Test ${new Date().toISOString()}`,
      html: `<h1>Test Email</h1><p>Testing alternative email address.</p>`,
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Alternative email result:', response.status, data);
  }
}

testResendDirect().then(() => testAlternativeEmail());
