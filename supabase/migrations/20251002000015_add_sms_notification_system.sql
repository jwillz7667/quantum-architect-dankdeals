-- Add SMS notification system using Twilio
-- Supports order confirmations, updates, and delivery notifications

-- Step 1: Create SMS queue table (similar to email_queue)
CREATE TABLE IF NOT EXISTS public.sms_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  sms_type TEXT NOT NULL CHECK (sms_type IN ('order_confirmation', 'order_update', 'delivery_notification')),
  to_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  twilio_sid TEXT, -- Twilio message SID for tracking
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for sms_queue
ALTER TABLE public.sms_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to sms_queue" ON public.sms_queue
  FOR ALL TO public
  USING (
    (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
    OR (
      (SELECT auth.uid()) IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
      )
    )
  );

-- Step 2: Create indexes for performance
CREATE INDEX idx_sms_queue_status_scheduled
  ON public.sms_queue(status, scheduled_at)
  WHERE status IN ('pending', 'processing');

CREATE INDEX idx_sms_queue_order_id
  ON public.sms_queue(order_id);

CREATE INDEX idx_sms_queue_pending
  ON public.sms_queue(status, created_at)
  WHERE status = 'pending';

-- Step 3: Create trigger to update updated_at
CREATE TRIGGER update_sms_queue_updated_at
  BEFORE UPDATE ON public.sms_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Create function to queue SMS on order creation
CREATE OR REPLACE FUNCTION queue_order_sms_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  phone_number TEXT;
  sms_message TEXT;
BEGIN
  -- Only queue SMS for new orders with valid phone numbers
  IF TG_OP = 'INSERT' AND NEW.customer_phone_number IS NOT NULL AND NEW.customer_phone_number != '' THEN

    -- Validate phone number format (basic validation)
    phone_number := regexp_replace(NEW.customer_phone_number, '[^0-9+]', '', 'g');

    IF length(phone_number) >= 10 THEN
      -- Create SMS message
      sms_message := format(
        'DankDeals Order Confirmed! Order #%s - Total: $%s. Track your order at dankdealsmn.com/orders',
        NEW.order_number,
        NEW.total_amount::text
      );

      -- Queue SMS
      INSERT INTO public.sms_queue (
        order_id,
        sms_type,
        to_phone,
        message,
        priority,
        status,
        data
      ) VALUES (
        NEW.id,
        'order_confirmation',
        phone_number,
        sms_message,
        'high',
        'pending',
        jsonb_build_object(
          'orderId', NEW.id::text,
          'orderNumber', NEW.order_number
        )
      );

      RAISE NOTICE 'SMS queued for order %', NEW.order_number;
    ELSE
      RAISE WARNING 'Invalid phone number for order %: %', NEW.order_number, NEW.customer_phone_number;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to auto-queue SMS on order creation
CREATE TRIGGER queue_order_sms
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION queue_order_sms_notification();

-- Step 5: Create helper function to get SMS stats
CREATE OR REPLACE FUNCTION get_sms_queue_stats()
RETURNS TABLE (
  status TEXT,
  count BIGINT,
  oldest_pending TIMESTAMPTZ,
  newest_pending TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sq.status,
    COUNT(*)::BIGINT as count,
    MIN(CASE WHEN sq.status = 'pending' THEN sq.scheduled_at END) as oldest_pending,
    MAX(CASE WHEN sq.status = 'pending' THEN sq.scheduled_at END) as newest_pending
  FROM public.sms_queue sq
  GROUP BY sq.status
  ORDER BY
    CASE sq.status
      WHEN 'pending' THEN 1
      WHEN 'processing' THEN 2
      WHEN 'sent' THEN 3
      WHEN 'failed' THEN 4
    END;
END;
$$;

-- Step 6: Create function to reset stuck SMS jobs
CREATE OR REPLACE FUNCTION reset_stuck_sms_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  reset_count INT;
BEGIN
  -- Reset SMS stuck in 'processing' for more than 10 minutes
  UPDATE public.sms_queue
  SET
    status = 'pending',
    updated_at = NOW()
  WHERE
    status = 'processing'
    AND last_attempt_at < NOW() - INTERVAL '10 minutes';

  GET DIAGNOSTICS reset_count = ROW_COUNT;

  RETURN reset_count;
END;
$$;

-- Step 7: Create cleanup function for old SMS
CREATE OR REPLACE FUNCTION cleanup_old_sms_queue_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  deleted_count INT;
BEGIN
  -- Delete completed SMS older than 30 days
  DELETE FROM public.sms_queue
  WHERE
    status IN ('sent', 'failed')
    AND completed_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.sms_queue TO authenticated;
GRANT ALL ON public.sms_queue TO service_role;
GRANT EXECUTE ON FUNCTION queue_order_sms_notification() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_sms_queue_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_stuck_sms_jobs() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_sms_queue_jobs() TO service_role;

-- Add comments
COMMENT ON TABLE public.sms_queue IS
'Queue for outbound SMS messages sent via Twilio. Supports order confirmations, updates, and delivery notifications.';

COMMENT ON FUNCTION queue_order_sms_notification() IS
'Automatically queues an SMS confirmation when a new order is created. Validates phone number format and creates a concise order confirmation message.';

COMMENT ON FUNCTION get_sms_queue_stats() IS
'Returns statistics about the SMS queue including pending, sent, and failed counts.';

-- Add cron jobs for SMS processing (if pg_cron is available)
-- These will be created via separate migration or dashboard
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SMS NOTIFICATION SYSTEM INSTALLED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Database tables and functions created successfully.';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Create process-sms-queue edge function (see documentation)';
  RAISE NOTICE '2. Add Twilio credentials to edge function secrets:';
  RAISE NOTICE '   - TWILIO_ACCOUNT_SID';
  RAISE NOTICE '   - TWILIO_AUTH_TOKEN';
  RAISE NOTICE '   - TWILIO_PHONE_NUMBER';
  RAISE NOTICE '3. Set up pg_cron job to call edge function every 5 minutes';
  RAISE NOTICE '4. Test with a sample order';
  RAISE NOTICE '';
  RAISE NOTICE 'MONITORING:';
  RAISE NOTICE '- Check queue status: SELECT * FROM get_sms_queue_stats();';
  RAISE NOTICE '- View pending SMS: SELECT * FROM sms_queue WHERE status = ''pending'';';
  RAISE NOTICE '';
END $$;
