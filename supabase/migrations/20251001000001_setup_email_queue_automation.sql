-- Setup automated email queue processing with pg_cron and monitoring
-- This migration configures automatic processing of the email queue every 5 minutes

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions for pg_cron
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create a monitoring function for email queue health
CREATE OR REPLACE FUNCTION public.get_email_queue_stats()
RETURNS TABLE(
  status TEXT,
  count BIGINT,
  oldest_pending TIMESTAMPTZ,
  newest_pending TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  SELECT
    eq.status,
    COUNT(*)::BIGINT as count,
    MIN(CASE WHEN eq.status = 'pending' THEN eq.scheduled_at END) as oldest_pending,
    MAX(CASE WHEN eq.status = 'pending' THEN eq.scheduled_at END) as newest_pending
  FROM public.email_queue eq
  GROUP BY eq.status
  ORDER BY
    CASE eq.status
      WHEN 'pending' THEN 1
      WHEN 'processing' THEN 2
      WHEN 'sent' THEN 3
      WHEN 'failed' THEN 4
    END;
END;
$$;

COMMENT ON FUNCTION public.get_email_queue_stats() IS 'Returns email queue statistics for monitoring dashboard';

-- Create function to check for stuck processing emails
CREATE OR REPLACE FUNCTION public.reset_stuck_email_jobs()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
DECLARE
  reset_count INT;
BEGIN
  -- Reset emails stuck in 'processing' for more than 10 minutes
  UPDATE public.email_queue
  SET
    status = 'pending',
    updated_at = NOW()
  WHERE
    status = 'processing'
    AND last_attempt_at < NOW() - INTERVAL '10 minutes';

  GET DIAGNOSTICS reset_count = ROW_COUNT;

  RETURN reset_count;
END;
$$;

COMMENT ON FUNCTION public.reset_stuck_email_jobs() IS 'Resets email jobs stuck in processing status for more than 10 minutes';

-- Create a function to get failed email details for troubleshooting
CREATE OR REPLACE FUNCTION public.get_failed_emails(days_back INT DEFAULT 7)
RETURNS TABLE(
  id UUID,
  email_type TEXT,
  to_email TEXT,
  subject TEXT,
  attempts INT,
  error TEXT,
  created_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  SELECT
    eq.id,
    eq.email_type,
    eq.to_email,
    eq.subject,
    eq.attempts,
    eq.error,
    eq.created_at,
    eq.last_attempt_at
  FROM public.email_queue eq
  WHERE
    eq.status = 'failed'
    AND eq.created_at > NOW() - (days_back || ' days')::INTERVAL
  ORDER BY eq.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_failed_emails(INT) IS 'Returns details of failed email jobs for troubleshooting';

-- Create cleanup function for old emails
CREATE OR REPLACE FUNCTION public.cleanup_old_email_queue_jobs()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
DECLARE
  deleted_count INT;
BEGIN
  -- Delete completed emails older than 30 days
  DELETE FROM public.email_queue
  WHERE
    status IN ('sent', 'failed')
    AND completed_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_email_queue_jobs() IS 'Deletes sent/failed email jobs older than 30 days';

-- Grant execute permissions to appropriate roles
GRANT EXECUTE ON FUNCTION public.get_email_queue_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reset_stuck_email_jobs() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_failed_emails(INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_email_queue_jobs() TO service_role;

-- Setup pg_cron job for email queue processing
-- Note: This uses pg_net extension to make HTTP requests from the database
-- The job runs every 5 minutes

-- First, ensure pg_net extension is available for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the email queue processor to run every 5 minutes
-- Note: Replace the URL and token with your actual values
-- The schedule uses cron syntax: '*/5 * * * *' = every 5 minutes
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/process-email-queue',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.queue_processor_token', true),
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

-- Store the queue processor token in database settings
-- Note: This should be set via SQL or the Supabase dashboard
-- You can retrieve it from your secrets using: supabase secrets list
-- ALTER DATABASE postgres SET app.settings.queue_processor_token = 'your-token-here';

-- Create index for monitoring queries
CREATE INDEX IF NOT EXISTS idx_email_queue_monitoring
ON public.email_queue(status, created_at, last_attempt_at);

-- Add comments for documentation
COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL - used for automated email queue processing';
COMMENT ON EXTENSION pg_net IS 'HTTP client for PostgreSQL - used to call edge functions from cron jobs';
