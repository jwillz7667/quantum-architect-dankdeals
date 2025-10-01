-- Fix email queue automation to work with Supabase permissions
-- Since we can't use ALTER DATABASE SET in managed Supabase, we'll use a config table instead

-- Create a secure configuration table for storing system settings
CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Only service role can access config
CREATE POLICY "Service role full access" ON public.system_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Create function to get config values
CREATE OR REPLACE FUNCTION public.get_config(config_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
BEGIN
  RETURN (SELECT value FROM public.system_config WHERE key = config_key);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_config(TEXT) TO postgres, service_role;

-- Insert the queue processor token placeholder
-- Note: You'll need to update this with the actual token value after running this migration
INSERT INTO public.system_config (key, value, description)
VALUES (
  'queue_processor_token',
  'PLACEHOLDER_UPDATE_THIS',
  'Token for authenticating email queue processor cron jobs'
)
ON CONFLICT (key) DO NOTHING;

-- Drop the old cron jobs that used database settings
SELECT cron.unschedule('process-email-queue') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-email-queue'
);
SELECT cron.unschedule('reset-stuck-emails') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'reset-stuck-emails'
);
SELECT cron.unschedule('cleanup-old-emails') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-emails'
);

-- Recreate cron jobs using the config table
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/process-email-queue',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || public.get_config('queue_processor_token'),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('action', 'process')
    );
  $$
);

-- Schedule stuck job reset every 15 minutes
SELECT cron.schedule(
  'reset-stuck-emails',
  '*/15 * * * *',
  'SELECT public.reset_stuck_email_jobs();'
);

-- Schedule cleanup of old emails once per day at 3 AM
SELECT cron.schedule(
  'cleanup-old-emails',
  '0 3 * * *',
  'SELECT public.cleanup_old_email_queue_jobs();'
);

-- Create helper function to update the token securely
CREATE OR REPLACE FUNCTION public.update_queue_processor_token(new_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
BEGIN
  -- Only allow service role to update
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Only service role can update system configuration';
  END IF;

  UPDATE public.system_config
  SET value = new_token, updated_at = NOW()
  WHERE key = 'queue_processor_token';

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_queue_processor_token(TEXT) TO service_role;

COMMENT ON TABLE public.system_config IS 'System configuration key-value store for sensitive settings';
COMMENT ON FUNCTION public.get_config(TEXT) IS 'Retrieve system configuration value by key';
COMMENT ON FUNCTION public.update_queue_processor_token(TEXT) IS 'Securely update the queue processor authentication token';
