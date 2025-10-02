import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Type definitions for Deno
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
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

serve(async (req: Request) => {
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

    // Verify webhook signature for security (Resend uses Svix for webhooks)
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');

    // Get raw body for signature verification
    const rawBody = await req.text();

    if (webhookSecret && svixId && svixTimestamp && svixSignature) {
      // Verify signature using Svix's verification algorithm
      // Format: whsec_... secret
      try {
        // Svix uses HMAC SHA256 with format: v1,<signature>
        const encoder = new TextEncoder();
        const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;

        // Extract secret (remove whsec_ prefix)
        const secretBytes = encoder.encode(webhookSecret.replace('whsec_', ''));
        const key = await crypto.subtle.importKey(
          'raw',
          secretBytes,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));

        const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));

        // Svix sends multiple signatures in format: v1,sig1 v1,sig2
        const signatures = svixSignature.split(' ').map((s) => s.split(',')[1]);

        if (!signatures.includes(expectedSignature)) {
          console.error('Invalid webhook signature');
          return new Response(JSON.stringify({ success: false, error: 'Invalid signature' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          });
        }

        console.log('Webhook signature verified successfully');
      } catch (error) {
        console.error('Signature verification failed:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Signature verification failed' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          }
        );
      }
    } else if (webhookSecret) {
      console.warn('Webhook secret configured but signature headers missing');
    }

    // Parse webhook payload (rawBody already read above for signature verification)
    let event: ResendWebhookEvent;
    try {
      event = JSON.parse(rawBody);
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
