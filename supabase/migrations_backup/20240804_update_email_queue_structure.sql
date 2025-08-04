-- Update email_queue table to match new structure
-- Add missing columns if they don't exist

-- Add scheduled_at column if it doesn't exist
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add priority column if it doesn't exist
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high'));

-- Add to_email column if it doesn't exist
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS to_email TEXT;

-- Add subject column if it doesn't exist
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS subject TEXT;

-- Add data column for flexible email data
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}';

-- Add max_attempts column
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS max_attempts INT NOT NULL DEFAULT 3;

-- Add completed_at column
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add error column (rename error_message if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_queue' AND column_name = 'error_message') THEN
    ALTER TABLE email_queue RENAME COLUMN error_message TO error;
  ELSE
    ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS error TEXT;
  END IF;
END $$;

-- Update email_type check constraint to include new types
ALTER TABLE email_queue DROP CONSTRAINT IF EXISTS email_queue_email_type_check;
ALTER TABLE email_queue ADD CONSTRAINT email_queue_email_type_check 
  CHECK (email_type IN ('ORDER_CONFIRMATION', 'ORDER_UPDATE', 'ADMIN_NOTIFICATION', 
                        'order_confirmation', 'order_update', 'delivery_notification'));

-- Update status check constraint to include new statuses
ALTER TABLE email_queue DROP CONSTRAINT IF EXISTS email_queue_status_check;
ALTER TABLE email_queue ADD CONSTRAINT email_queue_status_check 
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'sent'));

-- Create indexes for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled ON email_queue(status, scheduled_at) 
  WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_email_queue_priority_scheduled ON email_queue(priority, scheduled_at) 
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at);

-- Create order_processing_logs table
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

-- Enable RLS on new tables
ALTER TABLE order_processing_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for order_processing_logs
CREATE POLICY IF NOT EXISTS "Service role can manage order logs" ON order_processing_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Update function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS email_queue_updated_at ON email_queue;
CREATE TRIGGER email_queue_updated_at
  BEFORE UPDATE ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_email_queue_updated_at();