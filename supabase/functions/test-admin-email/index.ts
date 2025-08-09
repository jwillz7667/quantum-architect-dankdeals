import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

declare const Deno: {
  env: { get(key: string): string | undefined };
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'orders@dankdealsmn.com';
    const toEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@dankdealsmn.com';

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'RESEND_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const { to } = await (async () => {
      try {
        return await req.json();
      } catch {
        return { to: undefined };
      }
    })();

    const target = typeof to === 'string' && to.includes('@') ? to : toEmail;

    const payload = {
      from: `DankDeals <${fromEmail}>`,
      to: target,
      subject: 'Test Admin Email - DankDeals',
      html: `<p>This is a test email from Supabase Edge Function at ${new Date().toISOString()}.</p>`,
    };

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data: unknown = undefined;
    try {
      data = JSON.parse(text);
    } catch {
      /* keep raw */
    }

    if (!resp.ok) {
      return new Response(
        JSON.stringify({ success: false, status: resp.status, body: data ?? text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, status: resp.status, body: data ?? text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
