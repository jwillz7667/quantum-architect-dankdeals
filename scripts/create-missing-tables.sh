#!/bin/bash

# Script to create missing tables in production database

echo "Creating missing tables..."

# SQL to create order_processing_logs table
SQL="
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
CREATE POLICY \"Service role can manage order logs\" ON order_processing_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Update email_queue table structure
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high'));
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS to_email TEXT;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}';
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS max_attempts INT NOT NULL DEFAULT 3;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create indexes for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled ON email_queue(status, scheduled_at) 
  WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_email_queue_priority_scheduled ON email_queue(priority, scheduled_at) 
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at);
"

# Use curl to execute SQL via Supabase API
curl -X POST "https://ralbzuvkyexortqngvxs.supabase.co/rest/v1/rpc/sql" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbGJ6dXZreWV4b3J0cW5ndnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTM5OTc3MSwiZXhwIjoyMDY2OTc1NzcxfQ.LoSY_0ZD_oGkYac1-HP6A56OxluBEZfUN7EE_-0yCTo" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbGJ6dXZreWV4b3J0cW5ndnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTM5OTc3MSwiZXhwIjoyMDY2OTc1NzcxfQ.LoSY_0ZD_oGkYac1-HP6A56OxluBEZfUN7EE_-0yCTo" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$SQL\"}"

echo "Tables created successfully!"