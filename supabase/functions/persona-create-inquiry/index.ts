import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

declare const Deno: { env: { get(key: string): string | undefined } };

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const PERSONA_API_KEY = Deno.env.get('PERSONA_API_KEY');
    if (!PERSONA_API_KEY) {
      return new Response(JSON.stringify({ error: 'Persona not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const { reference_id, environment = 'production' } = await req.json();
    if (!reference_id) {
      return new Response(JSON.stringify({ error: 'reference_id is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const resp = await fetch('https://withpersona.com/api/v1/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PERSONA_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: 'inquiry',
          attributes: { templateId: 'default', environment, referenceId: reference_id },
        },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(JSON.stringify({ error: text || 'Failed to create inquiry' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      });
    }

    const data = await resp.json();
    const inquiryId = data?.data?.id;
    const clientToken = data?.data?.attributes?.['client-secret'];
    return new Response(JSON.stringify({ inquiry_id: inquiryId, client_token: clientToken }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
