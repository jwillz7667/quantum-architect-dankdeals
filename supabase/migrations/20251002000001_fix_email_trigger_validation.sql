-- Fix email trigger to properly validate email and add error handling
-- This fixes the issue where empty emails or failed queue inserts were silently ignored

-- Drop the old trigger function
DROP FUNCTION IF EXISTS public.queue_order_confirmation_email_v2() CASCADE;

-- Create improved trigger function with validation and error handling
CREATE OR REPLACE FUNCTION public.queue_order_confirmation_email_v3()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
DECLARE
  v_email_id UUID;
BEGIN
  -- Queue email immediately when order is CREATED (INSERT)
  -- OR when status changes to 'confirmed'

  IF (TG_OP = 'INSERT' AND NEW.customer_email IS NOT NULL AND NEW.customer_email != '') THEN
    -- Validate email format
    IF NEW.customer_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
      RAISE WARNING 'Invalid email format for order %: %', NEW.order_number, NEW.customer_email;
      RETURN NEW;
    END IF;

    -- New order created - queue confirmation email
    BEGIN
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
        jsonb_build_object(
          'orderId', NEW.id::text,
          'orderNumber', NEW.order_number
        ),
        'high',
        'pending'
      ) RETURNING id INTO v_email_id;

      RAISE NOTICE 'Email queued for new order % (email_id: %)', NEW.order_number, v_email_id;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to queue email for order %: % - %', NEW.order_number, SQLERRM, SQLSTATE;
      -- Don't fail the order creation, just log the error
    END;

  ELSIF (TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed')) THEN
    -- Validate email format
    IF NEW.customer_email IS NULL OR NEW.customer_email = '' THEN
      RAISE WARNING 'No email for confirmed order %', NEW.order_number;
      RETURN NEW;
    END IF;

    IF NEW.customer_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
      RAISE WARNING 'Invalid email format for order %: %', NEW.order_number, NEW.customer_email;
      RETURN NEW;
    END IF;

    -- Status changed to confirmed - queue email if not already queued
    IF NOT EXISTS (
      SELECT 1 FROM public.email_queue
      WHERE order_id = NEW.id AND email_type = 'order_confirmation'
    ) THEN
      BEGIN
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
          jsonb_build_object(
            'orderId', NEW.id::text,
            'orderNumber', NEW.order_number
          ),
          'high',
          'pending'
        ) RETURNING id INTO v_email_id;

        RAISE NOTICE 'Email queued for confirmed order % (email_id: %)', NEW.order_number, v_email_id;

      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to queue email for order %: % - %', NEW.order_number, SQLERRM, SQLSTATE;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS queue_order_email_v2 ON public.orders;
DROP TRIGGER IF EXISTS queue_order_email ON public.orders;

-- Create new trigger that fires on INSERT and UPDATE
CREATE TRIGGER queue_order_email_v3
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_order_confirmation_email_v3();

-- Grant permissions
GRANT ALL ON FUNCTION public.queue_order_confirmation_email_v3() TO anon, authenticated, service_role;

-- Comment for documentation
COMMENT ON FUNCTION public.queue_order_confirmation_email_v3() IS
  'Queues order confirmation emails immediately on INSERT (with email validation), or when status changes to confirmed. Includes error handling and logging. Prevents duplicate emails.';
