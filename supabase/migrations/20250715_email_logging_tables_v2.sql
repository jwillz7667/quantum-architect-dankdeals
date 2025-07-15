-- Create email logging tables for Resend webhook events (v2 - conflict-free)

-- Email logs table to track all email events
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id TEXT, -- Resend email ID
  event_type TEXT NOT NULL, -- sent, delivered, bounced, opened, clicked, etc.
  event_data JSONB, -- Full event data from Resend
  to_email TEXT,
  from_email TEXT,
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email bounces table for managing bounce handling
CREATE TABLE IF NOT EXISTS public.email_bounces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  bounce_type TEXT, -- hard, soft
  bounce_reason TEXT,
  bounce_count INTEGER DEFAULT 1,
  first_bounced_at TIMESTAMPTZ DEFAULT NOW(),
  last_bounced_at TIMESTAMPTZ DEFAULT NOW(),
  is_suppressed BOOLEAN DEFAULT false,
  CONSTRAINT unique_email_bounce UNIQUE(email)
);

-- Email analytics table for tracking email performance
CREATE TABLE IF NOT EXISTS public.email_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_type TEXT, -- order_confirmation, welcome, etc.
  recipient_email TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  complained_at TIMESTAMPTZ,
  email_id TEXT, -- Resend email ID
  order_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance (with IF NOT EXISTS equivalent using DO blocks)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_email_logs_email_id') THEN
    CREATE INDEX idx_email_logs_email_id ON public.email_logs(email_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_email_logs_event_type') THEN
    CREATE INDEX idx_email_logs_event_type ON public.email_logs(event_type);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_email_logs_to_email') THEN
    CREATE INDEX idx_email_logs_to_email ON public.email_logs(to_email);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_email_logs_created_at') THEN
    CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_email_bounces_email') THEN
    CREATE INDEX idx_email_bounces_email ON public.email_bounces(email);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_email_bounces_is_suppressed') THEN
    CREATE INDEX idx_email_bounces_is_suppressed ON public.email_bounces(is_suppressed);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_email_analytics_email_type') THEN
    CREATE INDEX idx_email_analytics_email_type ON public.email_analytics(email_type);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_email_analytics_recipient') THEN
    CREATE INDEX idx_email_analytics_recipient ON public.email_analytics(recipient_email);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_email_analytics_order_id') THEN
    CREATE INDEX idx_email_analytics_order_id ON public.email_analytics(order_id);
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_bounces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (using DO blocks to avoid conflicts)
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Service role can manage email logs" ON public.email_logs;
  DROP POLICY IF EXISTS "Service role can manage email bounces" ON public.email_bounces;
  DROP POLICY IF EXISTS "Service role can manage email analytics" ON public.email_analytics;
  
  -- Create new policies
  CREATE POLICY "Service role can manage email logs" ON public.email_logs
    FOR ALL USING (true);

  CREATE POLICY "Service role can manage email bounces" ON public.email_bounces
    FOR ALL USING (true);

  CREATE POLICY "Service role can manage email analytics" ON public.email_analytics
    FOR ALL USING (true);
END $$;

-- Add comments
COMMENT ON TABLE public.email_logs IS 'Stores all email events from Resend webhooks';
COMMENT ON TABLE public.email_bounces IS 'Tracks bounced emails for suppression and management';
COMMENT ON TABLE public.email_analytics IS 'Email performance analytics and tracking';