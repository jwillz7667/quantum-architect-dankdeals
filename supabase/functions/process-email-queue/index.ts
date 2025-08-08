// Email queue processor edge function
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { EmailQueueProcessor } from '../_shared/email-queue-processor.ts';
import { logger } from '../_shared/logger.ts';

// Type definitions for Deno
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const correlationId = crypto.randomUUID();
  logger.setContext({ correlationId });

  try {
    logger.info('Email queue processor triggered', {
      method: req.method,
      url: req.url,
    });

    // Verify this is an authorized request
    // In production, you might want to check for a secret token or use Supabase auth
    const authToken = req.headers.get('Authorization');
    const expectedToken = Deno.env.get('QUEUE_PROCESSOR_TOKEN');

    if (expectedToken && authToken !== `Bearer ${expectedToken}`) {
      logger.warn('Unauthorized queue processor request');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // Verify environment configuration
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'RESEND_API_KEY',
      'FROM_EMAIL',
    ];

    for (const envVar of requiredEnvVars) {
      if (!Deno.env.get(envVar)) {
        logger.error(`Missing environment variable: ${envVar}`);
        throw new Error('Server configuration error');
      }
    }

    // Parse optional parameters
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'process';

    const processor = new EmailQueueProcessor();

    switch (action) {
      case 'process':
        // Process pending emails
        await processor.processQueue();

        const processDuration = Date.now() - startTime;
        logger.info('Queue processing completed', {
          duration: processDuration,
          correlationId,
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Email queue processed',
            duration: processDuration,
            correlationId,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );

      case 'cleanup':
        // Clean up old completed/failed jobs
        const daysToKeep = parseInt(url.searchParams.get('days') || '30');
        await processor.cleanupOldJobs(daysToKeep);

        const cleanupDuration = Date.now() - startTime;
        logger.info('Queue cleanup completed', {
          duration: cleanupDuration,
          daysToKeep,
          correlationId,
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: `Cleaned up jobs older than ${daysToKeep} days`,
            duration: cleanupDuration,
            correlationId,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: `Unknown action: ${action}`,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Email queue processor error', error, {
      duration,
      correlationId,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed',
        correlationId,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});

// This function can be called periodically via:
// 1. Supabase pg_cron (database triggers)
// 2. External cron service (e.g., cron-job.org)
// 3. GitHub Actions on a schedule
// 4. Vercel/Netlify scheduled functions

// Example pg_cron setup:
// SELECT cron.schedule(
//   'process-email-queue',
//   '*/5 * * * *', -- Every 5 minutes
//   $$
//     SELECT
//       net.http_post(
//         url := 'https://your-project.supabase.co/functions/v1/process-email-queue',
//         headers := jsonb_build_object(
//           'Authorization', 'Bearer ' || current_setting('app.settings.queue_processor_token'),
//           'Content-Type', 'application/json'
//         ),
//         body := jsonb_build_object('action', 'process')
//       );
//   $$
// );
