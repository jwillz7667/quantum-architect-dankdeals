import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';
import { logger } from '../_shared/logger.ts';

declare const Deno: { env: { get(key: string): string | undefined } };

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const AEROPAY_API_KEY = Deno.env.get('AEROPAY_API_KEY');
    const AEROPAY_RETURN_URL = Deno.env.get('AEROPAY_RETURN_URL');

    if (!AEROPAY_API_KEY || !AEROPAY_RETURN_URL) {
      return new Response(JSON.stringify({ error: 'Aeropay not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();
    if (error || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Create Aeropay checkout session (placeholder API call)
    const response = await fetch('https://api.aeropay.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AEROPAY_API_KEY}`,
      },
      body: JSON.stringify({
        amount: Math.round(order.total_amount * 100),
        currency: 'USD',
        metadata: { order_id: order.id, order_number: order.order_number },
        success_url: `${AEROPAY_RETURN_URL}?order=${encodeURIComponent(order.order_number)}`,
        cancel_url: `${AEROPAY_RETURN_URL}?order=${encodeURIComponent(order.order_number)}`,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error('Aeropay create session failed', undefined, { status: response.status, text });
      return new Response(JSON.stringify({ error: 'Failed to create Aeropay session' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      });
    }

    const data = await response.json();
    const url = data?.checkout_url || data?.url;

    // Record provider on order for traceability
    await supabase
      .from('orders')
      .update({ payment_provider: 'aeropay', payment_reference: data?.id || null })
      .eq('id', order.id);

    return new Response(JSON.stringify({ url }), {
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
