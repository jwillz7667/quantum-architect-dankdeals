# Email Queue Automation Setup Guide

## Prerequisites

- Supabase project with CLI access
- Edge functions deployed (`process-email-queue`, `test-admin-email`)
- Required secrets configured (RESEND_API_KEY, QUEUE_PROCESSOR_TOKEN, etc.)

## Step 1: Verify Current Setup

Check that all required secrets are configured:

```bash
supabase secrets list
```

You should see:

- ✅ RESEND_API_KEY
- ✅ FROM_EMAIL
- ✅ ADMIN_EMAIL
- ✅ QUEUE_PROCESSOR_TOKEN
- ✅ SUPABASE_URL
- ✅ SUPABASE_SERVICE_ROLE_KEY

## Step 2: Run Database Migrations

Push the new automation migration to your database:

```bash
supabase db push
```

This will apply:

- `20251001000001_setup_email_queue_automation.sql` - Sets up pg_cron jobs and monitoring functions
- `20251001000002_setup_email_queue_token.sql` - Configuration instructions

## Step 3: Configure Database Settings

Get your QUEUE_PROCESSOR_TOKEN:

```bash
supabase secrets list | grep QUEUE_PROCESSOR_TOKEN
```

Then, run this in the Supabase SQL Editor (Dashboard > SQL Editor):

```sql
-- Replace 'your-token-value-here' with the actual token digest
ALTER DATABASE postgres SET app.settings.queue_processor_token = 'your-token-value-here';
```

Verify it's set:

```sql
SELECT current_setting('app.settings.queue_processor_token', true);
```

## Step 4: Verify Scheduled Jobs

Check that pg_cron jobs are scheduled:

```sql
SELECT
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname IN ('process-email-queue', 'reset-stuck-emails', 'cleanup-old-emails');
```

You should see:

- `process-email-queue` - Every 5 minutes (`*/5 * * * *`)
- `reset-stuck-emails` - Every 15 minutes (`*/15 * * * *`)
- `cleanup-old-emails` - Daily at 3 AM (`0 3 * * *`)

## Step 5: Test Email Sending

### Test 1: Send Test Admin Email

```bash
curl -X POST \
  "https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/test-admin-email" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Expected response:

```json
{
  "success": true,
  "status": 200,
  "body": {
    "id": "1f7183ce-975f-4430-81e9-d2179f4f27ad"
  }
}
```

### Test 2: Queue an Email

Insert a test email into the queue:

```sql
INSERT INTO email_queue (
  email_type,
  to_email,
  subject,
  data,
  priority
) VALUES (
  'order_confirmation',
  'your-test-email@example.com',
  'Test Order Confirmation',
  jsonb_build_object('orderId', gen_random_uuid()),
  'high'
);
```

### Test 3: Manually Trigger Queue Processing

```bash
curl -X POST \
  "https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/process-email-queue?action=process" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_QUEUE_PROCESSOR_TOKEN"
```

Or via SQL:

```sql
SELECT net.http_post(
  url := 'https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/process-email-queue',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings.queue_processor_token', true),
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object('action', 'process')
);
```

## Step 6: Monitor Queue Status

Check the queue status:

```sql
SELECT * FROM public.get_email_queue_stats();
```

View recent activity:

```sql
SELECT
  id,
  email_type,
  status,
  attempts,
  created_at,
  completed_at
FROM email_queue
ORDER BY created_at DESC
LIMIT 10;
```

## Step 7: Verify Cron Job Execution

Check cron job execution history:

```sql
SELECT
  job.jobname,
  job_run_details.status,
  job_run_details.return_message,
  job_run_details.start_time,
  job_run_details.end_time
FROM cron.job_run_details
JOIN cron.job ON job.jobid = job_run_details.jobid
WHERE job.jobname = 'process-email-queue'
ORDER BY start_time DESC
LIMIT 10;
```

## Troubleshooting

### Issue: Cron jobs not running

**Solution 1:** Check if pg_cron extension is enabled:

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

If not present:

```sql
CREATE EXTENSION pg_cron;
```

**Solution 2:** Check if jobs are active:

```sql
UPDATE cron.job SET active = true WHERE jobname = 'process-email-queue';
```

### Issue: Jobs failing with authentication error

**Problem:** The `app.settings.queue_processor_token` is not set or incorrect.

**Solution:**

1. Get the correct token: `supabase secrets list | grep QUEUE_PROCESSOR_TOKEN`
2. Set it in database: `ALTER DATABASE postgres SET app.settings.queue_processor_token = 'token-value';`
3. Verify: `SELECT current_setting('app.settings.queue_processor_token', true);`

### Issue: Emails stuck in "pending"

**Solution 1:** Manually trigger processing:

```sql
SELECT net.http_post(...); -- See Step 5, Test 3
```

**Solution 2:** Check edge function logs in Supabase Dashboard > Edge Functions > process-email-queue > Logs

**Solution 3:** Reset stuck jobs:

```sql
SELECT public.reset_stuck_email_jobs();
```

### Issue: High failure rate

**Check error messages:**

```sql
SELECT error, COUNT(*) as count
FROM email_queue
WHERE status = 'failed'
GROUP BY error
ORDER BY count DESC;
```

**Common fixes:**

- Invalid email: Check `to_email` format
- Rate limit: Check Resend dashboard for limits
- Missing env vars: Verify all secrets are set: `supabase secrets list`

## Monitoring Dashboard

For ongoing monitoring, see [email-queue-monitoring.md](./email-queue-monitoring.md)

Key queries to bookmark:

1. Queue health: `SELECT * FROM get_email_queue_stats();`
2. Failed emails: `SELECT * FROM get_failed_emails(7);`
3. Stuck jobs: `SELECT public.reset_stuck_email_jobs();`

## Maintenance

### Daily

- Review failed emails: `SELECT * FROM get_failed_emails(1);`

### Weekly

- Check success rate trends
- Review error patterns

### Monthly

- Review queue performance metrics
- Adjust cron schedule if needed

## Advanced Configuration

### Adjust Processing Frequency

To change from 5 minutes to 3 minutes:

```sql
-- First, unschedule the old job
SELECT cron.unschedule('process-email-queue');

-- Then, create new schedule
SELECT cron.schedule(
  'process-email-queue',
  '*/3 * * * *',  -- Changed to every 3 minutes
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
```

### Pause Email Processing

```sql
UPDATE cron.job
SET active = false
WHERE jobname = 'process-email-queue';
```

Resume:

```sql
UPDATE cron.job
SET active = true
WHERE jobname = 'process-email-queue';
```

### Change Cleanup Retention Period

Default is 30 days. To change to 60 days, modify the function:

```sql
CREATE OR REPLACE FUNCTION public.cleanup_old_email_queue_jobs()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM public.email_queue
  WHERE
    status IN ('sent', 'failed')
    AND completed_at < NOW() - INTERVAL '60 days';  -- Changed from 30 to 60

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
```

## Next Steps

1. Set up monitoring alerts (see [email-queue-monitoring.md](./email-queue-monitoring.md))
2. Integrate queue stats into admin dashboard
3. Configure Resend webhooks for bounce handling
4. Set up logging aggregation (e.g., Datadog, Sentry)

## Support Resources

- [Supabase pg_cron Documentation](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Resend API Documentation](https://resend.com/docs)
- [Email Queue Monitoring Guide](./email-queue-monitoring.md)
