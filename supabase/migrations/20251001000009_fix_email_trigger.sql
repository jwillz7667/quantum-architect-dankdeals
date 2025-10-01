-- FIX CRITICAL EMAIL BUG: Orders created with status='pending' but trigger only fires on 'confirmed'
-- This causes NO emails to be sent when orders are created

-- Drop the old trigger that requires status='confirmed'
DROP TRIGGER IF EXISTS queue_order_email ON public.orders;

-- Create new trigger function that queues emails on INSERT
CREATE OR REPLACE FUNCTION public.queue_order_confirmation_email_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
BEGIN
  -- Queue email immediately when order is CREATED (INSERT)
  -- OR when status changes to 'confirmed'
  IF (TG_OP = 'INSERT' AND NEW.customer_email IS NOT NULL) THEN
    -- New order created - queue confirmation email
    INSERT INTO public.email_queue (
      order_id,
      email_type,
      to_email,
      subject,
      data,
      priority,
      status
    ) VALUES (
      NEW.id,
      'order_confirmation',
      NEW.customer_email,
      'Order Confirmed - ' || NEW.order_number,
      jsonb_build_object('orderId', NEW.id::text),
      'high',
      'pending'
    );

    RAISE NOTICE 'Email queued for new order: %', NEW.order_number;

  ELSIF (TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed')) THEN
    -- Status changed to confirmed - queue email if not already queued
    IF NOT EXISTS (
      SELECT 1 FROM public.email_queue
      WHERE order_id = NEW.id AND email_type = 'order_confirmation'
    ) THEN
      INSERT INTO public.email_queue (
        order_id,
        email_type,
        to_email,
        subject,
        data,
        priority,
        status
      ) VALUES (
        NEW.id,
        'order_confirmation',
        NEW.customer_email,
        'Order Confirmed - ' || NEW.order_number,
        jsonb_build_object('orderId', NEW.id::text),
        'high',
        'pending'
      );

      RAISE NOTICE 'Email queued for confirmed order: %', NEW.order_number;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create new trigger that fires on INSERT and UPDATE
CREATE TRIGGER queue_order_email_v2
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_order_confirmation_email_v2();

-- Grant permissions
GRANT ALL ON FUNCTION public.queue_order_confirmation_email_v2() TO anon, authenticated, service_role;

-- Comment for documentation
COMMENT ON FUNCTION public.queue_order_confirmation_email_v2() IS
  'Queues order confirmation emails immediately on INSERT, or when status changes to confirmed. Prevents duplicate emails.';
