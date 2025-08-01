import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string;
    created_at?: string;
    // Delivery events
    delivered_at?: string;
    // Bounce events
    bounced_at?: string;
    bounce_type?: 'hard' | 'soft';
    bounce_reason?: string;
    // Click/Open events
    clicked_at?: string;
    opened_at?: string;
    link?: {
      url: string;
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing required environment variables');
      throw new Error('Server configuration error');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify webhook signature for security
    const signature = req.headers.get('resend-signature');
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');

    if (webhookSecret && signature) {
      // TODO: Implement proper webhook signature verification
      console.log('Webhook signature present, verification recommended');
    }

    // Parse webhook payload
    let event: ResendWebhookEvent;
    try {
      const body = await req.text();
      event = JSON.parse(body);
    } catch (error) {
      console.error('Invalid webhook payload:', error);
      return new Response(JSON.stringify({ success: false, error: 'Invalid payload' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('Resend webhook received:', {
      type: event.type,
      email_id: event.data.email_id,
      timestamp: event.created_at,
    });

    // Log the event to your email_logs table
    const { error: logError } = await supabase.from('email_logs').insert({
      email_id: event.data.email_id,
      event_type: event.type,
      event_data: event.data,
      created_at: event.created_at,
      to_email: Array.isArray(event.data.to) ? event.data.to[0] : event.data.to,
      from_email: event.data.from,
      subject: event.data.subject,
    });

    if (logError) {
      console.error('Failed to log email event:', logError);
      // Don't fail the webhook, just log the error
    }

    // Handle specific event types
    switch (event.type) {
      case 'email.sent':
        console.log(`Email sent: ${event.data.email_id}`);
        break;

      case 'email.delivered':
        console.log(`Email delivered: ${event.data.email_id} at ${event.data.delivered_at}`);
        break;

      case 'email.delivery_delayed':
        console.log(`Email delivery delayed: ${event.data.email_id}`);
        break;

      case 'email.bounced':
        console.log(
          `Email bounced: ${event.data.email_id}, type: ${event.data.bounce_type}, reason: ${event.data.bounce_reason}`
        );

        // If it's a hard bounce, you might want to mark the email as invalid
        if (event.data.bounce_type === 'hard') {
          // Update user profile or add to bounce list
          await supabase.from('email_bounces').upsert({
            email: Array.isArray(event.data.to) ? event.data.to[0] : event.data.to,
            bounce_type: event.data.bounce_type,
            bounce_reason: event.data.bounce_reason,
            bounced_at: event.data.bounced_at,
          });
        }
        break;

      case 'email.complained':
        console.log(`Email complained: ${event.data.email_id}`);
        // Handle spam complaints
        break;

      case 'email.opened':
        console.log(`Email opened: ${event.data.email_id} at ${event.data.opened_at}`);
        break;

      case 'email.clicked':
        console.log(`Email link clicked: ${event.data.email_id}, URL: ${event.data.link?.url}`);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('resend-webhook error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Webhook processing failed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
