-- Set the queue processor token value
UPDATE public.system_config
SET value = 'maJFxtscfgw0Sk4cHiC5g+bgi0xyxG6gwNeOuvWhWEg=',
    updated_at = NOW()
WHERE key = 'queue_processor_token';

-- Verify it was set
DO $$
DECLARE
  token_value TEXT;
BEGIN
  SELECT public.get_config('queue_processor_token') INTO token_value;
  RAISE NOTICE 'Queue processor token configured: %',
    CASE
      WHEN token_value = 'maJFxtscfgw0Sk4cHiC5g+bgi0xyxG6gwNeOuvWhWEg=' THEN 'SUCCESS ✓'
      ELSE 'FAILED - Token mismatch'
    END;
END $$;
