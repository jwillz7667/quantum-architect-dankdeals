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

    const signature = req.headers.get('stronghold-signature');
    if (WEBHOOK_SECRET && !signature) {
      return new Response('unauthorized', { status: 401, headers: corsHeaders });
    }

    const payload = await req.json();
    const eventType = payload?.type;
    const orderId = payload?.data?.metadata?.order_id;
    const providerPaymentId = payload?.data?.id;

    if (!orderId) {
      return new Response('ok', { status: 200, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    return new Response('ok', { status: 200, headers: corsHeaders });
  }
});
