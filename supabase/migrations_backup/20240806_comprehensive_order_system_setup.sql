-- Comprehensive Order System Setup
-- This migration creates all necessary tables, indexes, and policies for the new order processing system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create order_processing_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.order_processing_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'pending', 'processing')),
  details JSONB DEFAULT '{}',
  correlation_id UUID,
  duration_ms INT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for order_processing_logs
CREATE INDEX IF NOT EXISTS idx_order_processing_logs_order_id 
  ON public.order_processing_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_processing_logs_correlation_id 
  ON public.order_processing_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_order_processing_logs_created_at 
  ON public.order_processing_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_order_processing_logs_status 
  ON public.order_processing_logs(status, created_at);

-- Enable RLS on order_processing_logs
ALTER TABLE public.order_processing_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Service role can manage order logs" ON public.order_processing_logs;
CREATE POLICY "Service role can manage order logs" 
  ON public.order_processing_logs
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update email_queue table structure
DO $$ 
BEGIN
  -- Add missing columns to email_queue if they don't exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_queue') THEN
    -- Add scheduled_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'email_queue' AND column_name = 'scheduled_at') THEN
      ALTER TABLE public.email_queue ADD COLUMN scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;

    -- Add priority column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'email_queue' AND column_name = 'priority') THEN
      ALTER TABLE public.email_queue ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal';
    END IF;

    -- Add to_email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'email_queue' AND column_name = 'to_email') THEN
      ALTER TABLE public.email_queue ADD COLUMN to_email TEXT;
    END IF;

    -- Add subject column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'email_queue' AND column_name = 'subject') THEN
      ALTER TABLE public.email_queue ADD COLUMN subject TEXT;
    END IF;

    -- Add data column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'email_queue' AND column_name = 'data') THEN
      ALTER TABLE public.email_queue ADD COLUMN data JSONB NOT NULL DEFAULT '{}';
    END IF;

    -- Add max_attempts column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'email_queue' AND column_name = 'max_attempts') THEN
      ALTER TABLE public.email_queue ADD COLUMN max_attempts INT NOT NULL DEFAULT 3;
    END IF;

    -- Add completed_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'email_queue' AND column_name = 'completed_at') THEN
      ALTER TABLE public.email_queue ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;

    -- Rename error_message to error if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'email_queue' AND column_name = 'error_message') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'email_queue' AND column_name = 'error') THEN
      ALTER TABLE public.email_queue RENAME COLUMN error_message TO error;
    END IF;

    -- Add priority check constraint
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.check_constraints 
      WHERE constraint_schema = 'public' 
      AND constraint_name = 'email_queue_priority_check'
    ) THEN
      ALTER TABLE public.email_queue 
        ADD CONSTRAINT email_queue_priority_check 
        CHECK (priority IN ('low', 'normal', 'high'));
    END IF;

    -- Update email_type check constraint to include new types
    ALTER TABLE public.email_queue DROP CONSTRAINT IF EXISTS email_queue_email_type_check;
    ALTER TABLE public.email_queue 
      ADD CONSTRAINT email_queue_email_type_check 
      CHECK (email_type IN (
        'ORDER_CONFIRMATION', 'ORDER_UPDATE', 'ADMIN_NOTIFICATION',
        'order_confirmation', 'order_update', 'delivery_notification'
      ));

    -- Update status check constraint to include new statuses
    ALTER TABLE public.email_queue DROP CONSTRAINT IF EXISTS email_queue_status_check;
    ALTER TABLE public.email_queue 
      ADD CONSTRAINT email_queue_status_check 
      CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'sent'));

    -- Create indexes for efficient queue processing
    CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled 
      ON public.email_queue(status, scheduled_at) 
      WHERE status IN ('pending', 'processing');
    
    CREATE INDEX IF NOT EXISTS idx_email_queue_priority_scheduled 
      ON public.email_queue(priority, scheduled_at) 
      WHERE status = 'pending';
    
    CREATE INDEX IF NOT EXISTS idx_email_queue_created_at 
      ON public.email_queue(created_at);
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email_queue updated_at if it doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'email_queue' 
             AND column_name = 'updated_at') THEN
    DROP TRIGGER IF EXISTS email_queue_updated_at ON public.email_queue;
    CREATE TRIGGER email_queue_updated_at
      BEFORE UPDATE ON public.email_queue
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON public.order_processing_logs TO service_role;
GRANT SELECT ON public.order_processing_logs TO anon, authenticated;

-- Create a function to check if all required tables exist
CREATE OR REPLACE FUNCTION public.check_order_system_tables()
RETURNS TABLE (
  table_name TEXT,
  exists BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'orders'::TEXT, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders')
  UNION ALL
  SELECT 'order_items'::TEXT, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items')
  UNION ALL
  SELECT 'email_queue'::TEXT, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_queue')
  UNION ALL
  SELECT 'order_processing_logs'::TEXT, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_processing_logs');
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE public.order_processing_logs IS 'Audit log for order processing operations including API calls, state changes, and errors';
COMMENT ON COLUMN public.order_processing_logs.correlation_id IS 'UUID to correlate all operations for a single request';
COMMENT ON COLUMN public.order_processing_logs.duration_ms IS 'Operation duration in milliseconds';

-- Create helper function to create decrement_stock function if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'decrement_stock') THEN
    CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id UUID, p_quantity INTEGER)
    RETURNS VOID AS $func$
    BEGIN
      UPDATE public.products 
      SET stock_quantity = stock_quantity - p_quantity
      WHERE id = p_product_id 
      AND stock_quantity >= p_quantity;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
      END IF;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;