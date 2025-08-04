// Health check endpoint for monitoring system status
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { OrderMonitoring } from '../_shared/monitoring.ts';
import { logger } from '../_shared/logger.ts';
import '../_shared/deno-types.d.ts';

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    logger.info('Health check requested');

    // Perform health checks
    const healthStatus = await OrderMonitoring.healthCheck();
    const duration = Date.now() - startTime;

    logger.info('Health check completed', {
      healthy: healthStatus.healthy,
      duration,
      checks: healthStatus.checks.length,
    });

    // Return appropriate status code based on health
    const statusCode = healthStatus.healthy ? 200 : 503;

    return new Response(
      JSON.stringify({
        ...healthStatus,
        duration,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        status: statusCode,
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Health check failed', error, { duration });

    return new Response(
      JSON.stringify({
        healthy: false,
        timestamp: new Date().toISOString(),
        checks: [],
        error: error instanceof Error ? error.message : 'Health check failed',
        duration,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        status: 503,
      }
    );
  }
});

// This endpoint can be used by:
// 1. Uptime monitoring services (e.g., Pingdom, UptimeRobot)
// 2. Load balancers for health checks
// 3. Kubernetes liveness/readiness probes
// 4. Internal monitoring dashboards

// Example usage:
// GET https://your-project.supabase.co/functions/v1/health-check

// Response format:
/*
{
  "healthy": true,
  "timestamp": "2024-01-04T12:00:00Z",
  "checks": [
    {
      "service": "database",
      "status": "healthy",
      "message": "Database connection successful",
      "duration": 45
    },
    {
      "service": "email",
      "status": "healthy",
      "message": "Email service is operational",
      "duration": 120
    },
    {
      "service": "email_queue",
      "status": "healthy",
      "message": "5 emails in queue",
      "duration": 30
    }
  ],
  "metrics": {
    "ordersToday": 42,
    "pendingEmails": 5,
    "failedEmails": 0
  },
  "duration": 195
}
*/
