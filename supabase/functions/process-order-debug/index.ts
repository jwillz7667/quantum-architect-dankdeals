// Debug version of process-order to identify issues
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const debugInfo: any = {
    step: 'init',
    envVars: {},
    error: null,
  };

  try {
    // Check environment variables
    debugInfo.envVars = {
      SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      RESEND_API_KEY: !!Deno.env.get('RESEND_API_KEY'),
    };

    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !key) {
      debugInfo.step = 'env_check';
      debugInfo.error = 'Missing Supabase configuration';
      throw new Error('Missing Supabase configuration');
    }

    debugInfo.step = 'parse_body';
    const body = await req.json();
    debugInfo.hasBody = !!body;
    debugInfo.bodyKeys = Object.keys(body || {});

    const supabase = createClient(url, key);

    debugInfo.step = 'create_order';
    // Try a simple order insert
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: `TEST-${Date.now()}`,
        status: 'pending',
        customer_email: body.customer_email || 'test@example.com',
        customer_phone_number: body.customer_phone || '555-1234',
        subtotal: body.subtotal || 100,
        tax_amount: body.tax || 10,
        delivery_fee: body.delivery_fee || 10,
        total_amount: body.total || 120,
        delivery_first_name: body.delivery_first_name || 'Test',
        delivery_last_name: body.delivery_last_name || 'User',
        delivery_street_address: body.delivery_address?.street || '123 Test St',
        delivery_city: body.delivery_address?.city || 'Minneapolis',
        delivery_state: body.delivery_address?.state || 'MN',
        delivery_zip_code: body.delivery_address?.zipcode || '55401',
        payment_method: 'cash',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      debugInfo.step = 'order_error';
      debugInfo.error = orderError;
      debugInfo.errorCode = orderError.code;
      debugInfo.errorMessage = orderError.message;
      debugInfo.errorDetails = orderError.details;
      debugInfo.errorHint = orderError.hint;
    } else {
      debugInfo.step = 'success';
      debugInfo.orderId = order?.id;
      debugInfo.orderNumber = order?.order_number;
    }

    return new Response(
      JSON.stringify({
        success: !orderError,
        debugInfo,
        order: order || null,
        error: orderError,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Always return 200 for debug
      }
    );
  } catch (error) {
    debugInfo.step = 'catch_error';
    debugInfo.errorType = error.constructor.name;
    debugInfo.errorMessage = error.message;
    debugInfo.errorStack = error.stack;

    return new Response(
      JSON.stringify({
        success: false,
        debugInfo,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Always return 200 for debug
      }
    );
  }
});
