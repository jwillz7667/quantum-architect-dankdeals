// @ts-ignore - Deno types
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Type definitions for Deno
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'jwillz7667@gmail.com';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'orders@dankdealsmn.com';

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Test admin email function started');
    console.log('ADMIN_EMAIL:', ADMIN_EMAIL);
    console.log('FROM_EMAIL:', FROM_EMAIL);
    console.log('RESEND_API_KEY:', RESEND_API_KEY ? 'Set' : 'Missing');

    const payload = {
      from: `DankDeals Test <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `Edge Function Test - ${new Date().toISOString()}`,
      html: `
        <h1>Edge Function Test Email</h1>
        <p>This email was sent from the Supabase edge function.</p>
        <p>If you receive this, the edge function email sending is working.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
    };

    console.log('Sending email with payload:', JSON.stringify(payload));

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('Resend API response status:', response.status);
    console.log('Resend API response text:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON');
      responseData = { raw: responseText };
    }

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.status} - ${responseText}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test email sent',
        resendResponse: responseData,
        to: ADMIN_EMAIL,
        from: FROM_EMAIL,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
