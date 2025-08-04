-- Create order_processing_logs table for the new order processing system
CREATE TABLE IF NOT EXISTS order_processing_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  correlation_id UUID,
  duration_ms INT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for order_processing_logs
CREATE INDEX IF NOT EXISTS idx_order_processing_logs_order_id ON order_processing_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_processing_logs_correlation_id ON order_processing_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_order_processing_logs_created_at ON order_processing_logs(created_at);

-- Enable RLS on order_processing_logs
ALTER TABLE order_processing_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for service role
CREATE POLICY "Service role can manage order logs" ON order_processing_logs
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update email_queue table structure if it exists
DO $$ 
BEGIN
  -- Check if email_queue table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_queue') THEN
    -- Add missing columns
    ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal';
    ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS to_email TEXT;
    ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS subject TEXT;
    ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}';
    ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS max_attempts INT NOT NULL DEFAULT 3;
    ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

    -- Add check constraint for priority if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.check_constraints 
      WHERE constraint_name = 'email_queue_priority_check'
    ) THEN
      ALTER TABLE email_queue ADD CONSTRAINT email_queue_priority_check 
        CHECK (priority IN ('low', 'normal', 'high'));
    END IF;

    -- Create indexes for efficient queue processing
    CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled ON email_queue(status, scheduled_at) 
      WHERE status IN ('pending', 'processing');
    CREATE INDEX IF NOT EXISTS idx_email_queue_priority_scheduled ON email_queue(priority, scheduled_at) 
      WHERE status = 'pending';
    CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at);
  END IF;
END $$;