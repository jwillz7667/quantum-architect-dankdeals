import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';
import { EmailService } from '../_shared/email-service.ts';
import { logger } from '../_shared/logger.ts';

declare const Deno: { env: { get(key: string): string | undefined } };

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const WEBHOOK_SECRET = Deno.env.get('STRONGHOLD_WEBHOOK_SECRET');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Read raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('stronghold-signature') || '';
    if (WEBHOOK_SECRET) {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(WEBHOOK_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
      const computed = Array.from(new Uint8Array(sigBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      if (!signature || signature !== computed) {
        return new Response('unauthorized', { status: 401, headers: corsHeaders });
      }
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload?.type;
    const orderId = payload?.data?.metadata?.order_id as string | undefined;
    const providerPaymentId = payload?.data?.id as string | undefined;

    if (!orderId) {
      return new Response('ok', { status: 200, headers: corsHeaders });
    }

    // Idempotency
    if (providerPaymentId) {
      const { data: existing } = await supabase
        .from('payment_events')
        .select('id')
        .eq('provider', 'stronghold')
        .eq('event_id', providerPaymentId)
        .maybeSingle();
      if (existing) {
        return new Response('ok', { status: 200, headers: corsHeaders });
      }
      await supabase.from('payment_events').insert({
        provider: 'stronghold',
        event_id: providerPaymentId,
        event_type: eventType || 'unknown',
        order_id: orderId,
        payload,
      });
    }

    if (eventType === 'payment.succeeded') {
      const { data: order, error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_provider: 'stronghold',
          payment_reference: providerPaymentId,
          status: 'confirmed',
        })
        .eq('id', orderId)
        .select('*')
        .single();

      if (!error && order) {
        const email = new EmailService();
        try {
          await email.queueEmail({
            type: 'ORDER_CONFIRMATION',
            to: order.customer_email,
            subject: `Order Confirmed - ${order.order_number}`,
            data: { orderId: order.id },
            priority: 'high',
          });
        } catch (e) {
          logger.error('Failed to queue email after Stronghold payment', e, { orderId });
        }
      }
    } else if (eventType === 'payment.failed') {
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          payment_provider: 'stronghold',
          payment_reference: providerPaymentId,
          status: 'pending',
        })
        .eq('id', orderId);
    }

    return new Response('ok', { status: 200, headers: corsHeaders });
  } catch (e) {
    logger.error('Stronghold webhook handler error', e);
    return new Response('ok', { status: 200, headers: corsHeaders });
  }
});
