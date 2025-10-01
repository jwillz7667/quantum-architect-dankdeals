-- Setup configuration for email queue automation
-- This migration helps configure the queue processor token for pg_cron

-- IMPORTANT: Before running this migration, you need to:
-- 1. Get your QUEUE_PROCESSOR_TOKEN from: supabase secrets list
-- 2. Replace 'YOUR_TOKEN_HERE' below with the actual token value

-- Set the queue processor token as a database setting
-- This token is used by pg_cron to authenticate requests to the edge function
-- ALTER DATABASE postgres SET app.settings.queue_processor_token = 'YOUR_TOKEN_HERE';

-- To set the token, run this command in the Supabase SQL Editor:
-- Replace the placeholder with your actual token from: supabase secrets list

-- Example (DO NOT USE THIS TOKEN - GET YOUR OWN):
-- ALTER DATABASE postgres SET app.settings.queue_processor_token = 'your-actual-token-from-secrets-list';

-- Verify the token is set correctly:
-- SELECT current_setting('app.settings.queue_processor_token', true);

-- To update the scheduled job with the correct URL:
-- First, unschedule the old job:
-- SELECT cron.unschedule('process-email-queue');

-- Then reschedule with your actual project URL:
-- SELECT cron.schedule(
--   'process-email-queue',
--   '*/5 * * * *',
--   $$
--     SELECT net.http_post(
--       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-email-queue',
--       headers := jsonb_build_object(
--         'Authorization', 'Bearer ' || current_setting('app.settings.queue_processor_token', true),
--         'Content-Type', 'application/json'
--       ),
--       body := jsonb_build_object('action', 'process')
--     );
--   $$
-- );

-- View all scheduled cron jobs:
-- SELECT * FROM cron.job;

-- View cron job execution history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Manual trigger for testing (run in SQL editor):
-- SELECT net.http_post(
--   url := 'https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/process-email-queue',
--   headers := jsonb_build_object(
--     'Authorization', 'Bearer ' || current_setting('app.settings.queue_processor_token', true),
--     'Content-Type', 'application/json'
--   ),
--   body := jsonb_build_object('action', 'process')
-- );

SELECT 1; -- Placeholder to make this a valid migration file
