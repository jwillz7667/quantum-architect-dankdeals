-- Set valid QUEUE_PROCESSOR_TOKEN in system_config
-- This fixes the 401 Unauthorized error when pg_cron calls process-email-queue

-- Update the queue processor token with a secure random value
UPDATE public.system_config
SET
  value = 'Qlc+fcTql+boPwXE426vl+hKMehqrKmnB02xcofFdDw=',
  updated_at = NOW()
WHERE key = 'queue_processor_token';

-- Verify the token was set
DO $$
DECLARE
  token_value TEXT;
BEGIN
  SELECT value INTO token_value
  FROM public.system_config
  WHERE key = 'queue_processor_token';

  IF token_value IS NULL OR token_value = 'PLACEHOLDER_UPDATE_THIS' THEN
    RAISE EXCEPTION 'Failed to set queue_processor_token';
  END IF;

  RAISE NOTICE 'Queue processor token successfully set';
END $$;

-- Comment for documentation
COMMENT ON TABLE public.system_config IS
'System configuration key-value store. QUEUE_PROCESSOR_TOKEN must match the QUEUE_PROCESSOR_TOKEN environment variable in process-email-queue edge function.';
