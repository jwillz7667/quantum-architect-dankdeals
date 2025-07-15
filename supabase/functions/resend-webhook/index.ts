import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, resend-signature',
};

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify webhook signature (optional but recommended)
    const signature = req.headers.get('resend-signature');
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');

    if (webhookSecret && signature) {
      // In production, verify the webhook signature here
      // This is a security measure to ensure the webhook is from Resend
      console.log('Webhook signature verification would go here');
    }

    const body = await req.text();
    const event: ResendWebhookEvent = JSON.parse(body);

    console.log('Received Resend webhook event:', {
      type: event.type,
      emailId: event.data.email_id,
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
      console.error('Error logging email event:', logError);
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
    console.error('Webhook processing error:', error);

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
