-- Order Processing System Complete Setup
-- This migration adds the missing tables and updates for the new order processing system

-- Create order_processing_logs table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_order_processing_logs_order_id ON public.order_processing_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_processing_logs_correlation_id ON public.order_processing_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_order_processing_logs_created_at ON public.order_processing_logs(created_at);

-- Enable RLS
ALTER TABLE public.order_processing_logs ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Service role access" ON public.order_processing_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Update email_queue structure
ALTER TABLE public.email_queue 
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS to_email TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS max_attempts INT DEFAULT 3,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_queue_priority_check') THEN
    ALTER TABLE public.email_queue ADD CONSTRAINT email_queue_priority_check 
      CHECK (priority IN ('low', 'normal', 'high'));
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled ON public.email_queue(status, scheduled_at) 
  WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_email_queue_priority_scheduled ON public.email_queue(priority, scheduled_at) 
  WHERE status = 'pending';

-- Grant permissions
GRANT ALL ON public.order_processing_logs TO service_role;
GRANT SELECT ON public.order_processing_logs TO authenticated;