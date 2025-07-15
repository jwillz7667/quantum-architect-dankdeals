-- Simple email tables creation script
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ralbzuvkyexortqngvxs/sql

-- Create email logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB,
  to_email TEXT,
  from_email TEXT,
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email bounces table
CREATE TABLE IF NOT EXISTS public.email_bounces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  bounce_type TEXT,
  bounce_reason TEXT,
  bounce_count INTEGER DEFAULT 1,
  first_bounced_at TIMESTAMPTZ DEFAULT NOW(),
  last_bounced_at TIMESTAMPTZ DEFAULT NOW(),
  is_suppressed BOOLEAN DEFAULT false
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_email_id ON public.email_logs(email_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_event_type ON public.email_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON public.email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_bounces_email ON public.email_bounces(email);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_bounces ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Service role can manage email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Service role can manage email bounces" ON public.email_bounces;

-- Create simple policies for service role access
CREATE POLICY "Service role can manage email logs" ON public.email_logs
  FOR ALL USING (true);

CREATE POLICY "Service role can manage email bounces" ON public.email_bounces
  FOR ALL USING (true);

-- Comments
COMMENT ON TABLE public.email_logs IS 'Stores all email events from Resend webhooks';
COMMENT ON TABLE public.email_bounces IS 'Tracks bounced emails for suppression and management';