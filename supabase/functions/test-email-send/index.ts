// Test email sending function
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'orders@dankdealsmn.com';

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const { to = 'test@example.com' } = await req.json();

    const emailData = {
      from: `DankDeals <${FROM_EMAIL}>`,
      to,
      subject: 'Test Email from Supabase Edge Function',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email sent from Supabase Edge Function.</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>Environment: ${Deno.env.get('DENO_DEPLOYMENT_ID') || 'local'}</p>
      `,
    };

    console.log('Sending email to:', to);
    console.log('Using FROM_EMAIL:', FROM_EMAIL);
    console.log('API Key present:', !!RESEND_API_KEY);
    console.log('API Key length:', RESEND_API_KEY?.length);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailData),
    });

    const responseText = await response.text();
    console.log('Resend response status:', response.status);
    console.log('Resend response:', responseText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Resend API error',
          status: response.status,
          details: responseData,
          headers: Object.fromEntries(response.headers.entries()),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: responseData.id,
        details: responseData,
        headers: Object.fromEntries(response.headers.entries()),
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
        status: 500,
      }
    );
  }
});
