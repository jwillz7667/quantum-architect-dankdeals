// Unified order processing edge function
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';
import { OrderProcessor } from '../_shared/order-processor.ts';
import { EmailService } from '../_shared/email-service.ts';
import { OrderValidator } from '../_shared/validators.ts';
import { logger } from '../_shared/logger.ts';
import type { CreateOrderRequest } from '../_shared/types.ts';
import '../_shared/deno-types.d.ts';

serve(async (req: Request) => {
  // Generate correlation ID for request tracing
  const correlationId = crypto.randomUUID();
  logger.setContext({ correlationId });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    logger.info('Process order request received', {
      method: req.method,
      url: req.url,
    });

    // Verify environment configuration
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_ANON_KEY',
      'RESEND_API_KEY',
    ];

    for (const envVar of requiredEnvVars) {
      if (!Deno.env.get(envVar)) {
        logger.error(`Missing environment variable: ${envVar}`);
        throw new Error('Server configuration error');
      }
    }

    // Parse and validate request body
    let requestData: unknown;
    try {
      requestData = await req.json();
    } catch (error) {
      logger.error('Invalid JSON in request', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request body',
          correlationId,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Validate order data
    let validatedData: CreateOrderRequest;
    try {
      validatedData = OrderValidator.validate(requestData);
      logger.info('Order data validated', {
        itemCount: validatedData.items.length,
        total: validatedData.total,
      });
    } catch (error) {
      logger.error('Validation failed', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Validation failed',
          details: error instanceof Error && 'errors' in error ? error.errors : undefined,
          correlationId,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Check for authenticated user
    const authHeader = req.headers.get('Authorization');
    if (authHeader && !validatedData.user_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        {
          global: {
            headers: {
              Authorization: authHeader,
            },
          },
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (user && !authError) {
        validatedData.user_id = user.id;
        logger.info('User authenticated', { userId: user.id });
      }
    }

    // Process the order
    const processor = new OrderProcessor();
    const emailService = new EmailService();

    const result = await processor.processOrder(validatedData, {
      onSuccess: async (order) => {
        try {
          // Only auto-send confirmation for cash orders. Card providers (Aeropay/Stronghold)
          // will trigger confirmation via their webhook after payment is captured.
          if ((order.payment_method || 'cash').toLowerCase() === 'cash') {
            await emailService.queueEmail({
              type: 'ORDER_CONFIRMATION',
              to: order.customer_email,
              subject: `Order Confirmed - ${order.order_number}`,
              data: { orderId: order.id },
              priority: 'high',
            });

            logger.info('Order confirmation email queued', {
              orderId: order.id,
              orderNumber: order.order_number,
            });
          } else {
            logger.info(
              'Skipping confirmation email queue until payment is confirmed via webhook',
              {
                orderId: order.id,
                orderNumber: order.order_number,
                payment_method: order.payment_method,
              }
            );
          }
        } catch (error) {
          // Don't fail the order if email queueing fails
          logger.error('Failed to queue confirmation email', error, {
            orderId: order.id,
          });
        }
      },
    });

    const duration = Date.now() - startTime;
    logger.info('Order processing completed', {
      orderId: result.order.id,
      orderNumber: result.order.order_number,
      duration,
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: result.order.id,
          order_number: result.order.order_number,
          status: result.order.status,
          total: result.order.total_amount,
          created_at: result.order.created_at,
        },
        correlationId,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Order processing failed', error, {
      duration,
      correlationId,
    });

    // Determine appropriate status code
    let status = 500;
    let message = 'An unexpected error occurred';

    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        status = 400;
        message = error.message;
      } else if (error.name === 'InsufficientStockError') {
        status = 409;
        message = 'One or more items are out of stock';
      } else if (error.message.includes('Server configuration')) {
        status = 500;
        message = 'Server error. Please try again later.';
      } else {
        message = error.message;
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        correlationId,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status,
      }
    );
  }
});
