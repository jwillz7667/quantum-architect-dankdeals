# Email Queue Monitoring & Management

## Overview

The email queue system processes order confirmations, order updates, and delivery notifications automatically. This guide covers monitoring, troubleshooting, and management.

## Quick Health Check

Run this query in the Supabase SQL Editor to get current queue status:

```sql
SELECT * FROM public.get_email_queue_stats();
```

Expected output:

```
status      | count | oldest_pending         | newest_pending
------------|-------|------------------------|-------------------------
pending     | 5     | 2024-10-01 10:30:00-05 | 2024-10-01 10:35:00-05
processing  | 0     | null                   | null
sent        | 1250  | null                   | null
failed      | 3     | null                   | null
```

## Monitoring Queries

### 1. Check Queue Status Distribution

```sql
SELECT status, COUNT(*) as count
FROM email_queue
GROUP BY status
ORDER BY
  CASE status
    WHEN 'pending' THEN 1
    WHEN 'processing' THEN 2
    WHEN 'sent' THEN 3
    WHEN 'failed' THEN 4
  END;
```

### 2. View Pending Emails

```sql
SELECT
  id,
  email_type,
  to_email,
  subject,
  priority,
  scheduled_at,
  attempts,
  created_at
FROM email_queue
WHERE status = 'pending'
ORDER BY priority DESC, scheduled_at ASC
LIMIT 20;
```

### 3. Check Failed Emails (Last 7 Days)

```sql
SELECT * FROM public.get_failed_emails(7);
```

Or with more detail:

```sql
SELECT
  id,
  email_type,
  to_email,
  subject,
  attempts,
  error,
  created_at,
  last_attempt_at
FROM email_queue
WHERE
  status = 'failed'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### 4. Check Stuck Processing Jobs

```sql
SELECT
  id,
  email_type,
  to_email,
  status,
  attempts,
  last_attempt_at,
  NOW() - last_attempt_at as stuck_duration
FROM email_queue
WHERE
  status = 'processing'
  AND last_attempt_at < NOW() - INTERVAL '10 minutes'
ORDER BY last_attempt_at ASC;
```

### 5. Email Processing Rate (Last Hour)

```sql
SELECT
  DATE_TRUNC('minute', completed_at) as minute,
  COUNT(*) as emails_sent
FROM email_queue
WHERE
  status = 'sent'
  AND completed_at > NOW() - INTERVAL '1 hour'
GROUP BY DATE_TRUNC('minute', completed_at)
ORDER BY minute DESC;
```

### 6. Recent Email Activity

```sql
SELECT
  email_type,
  status,
  COUNT(*) as count,
  MAX(created_at) as last_created,
  MAX(completed_at) as last_completed
FROM email_queue
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY email_type, status
ORDER BY email_type, status;
```

## Management Functions

### Reset Stuck Jobs

If emails are stuck in "processing" status:

```sql
SELECT public.reset_stuck_email_jobs();
```

Returns the number of jobs reset.

### Manual Cleanup

Remove old completed/failed emails (older than 30 days):

```sql
SELECT public.cleanup_old_email_queue_jobs();
```

### Retry Failed Email

To retry a specific failed email:

```sql
UPDATE email_queue
SET
  status = 'pending',
  attempts = 0,
  error = NULL,
  scheduled_at = NOW(),
  updated_at = NOW()
WHERE id = 'your-email-id-here';
```

### Cancel Pending Email

```sql
UPDATE email_queue
SET
  status = 'failed',
  error = 'Manually cancelled',
  updated_at = NOW()
WHERE id = 'your-email-id-here';
```

## Automated Jobs Status

Check scheduled cron jobs:

```sql
SELECT
  jobid,
  schedule,
  command,
  active,
  database
FROM cron.job
WHERE jobname LIKE '%email%'
   OR jobname LIKE '%queue%';
```

View recent cron job executions:

```sql
SELECT
  job_run_details.job_pid,
  job.jobname,
  job_run_details.status,
  job_run_details.return_message,
  job_run_details.start_time,
  job_run_details.end_time
FROM cron.job_run_details
JOIN cron.job ON job.jobid = job_run_details.jobid
WHERE job.jobname IN ('process-email-queue', 'reset-stuck-emails', 'cleanup-old-emails')
ORDER BY start_time DESC
LIMIT 20;
```

## Alerts & Thresholds

### High Priority Alerts

1. **Failed Emails > 10 in last hour**

```sql
SELECT COUNT(*) as failed_count
FROM email_queue
WHERE
  status = 'failed'
  AND created_at > NOW() - INTERVAL '1 hour'
HAVING COUNT(*) > 10;
```

2. **Pending Emails Older Than 30 Minutes**

```sql
SELECT COUNT(*) as stuck_count
FROM email_queue
WHERE
  status = 'pending'
  AND scheduled_at < NOW() - INTERVAL '30 minutes';
```

3. **Processing Jobs Stuck > 10 Minutes**

```sql
SELECT COUNT(*) as stuck_processing
FROM email_queue
WHERE
  status = 'processing'
  AND last_attempt_at < NOW() - INTERVAL '10 minutes';
```

## Troubleshooting

### Common Issues

#### 1. Emails Not Being Sent

**Check:**

- Cron job is scheduled: `SELECT * FROM cron.job WHERE jobname = 'process-email-queue';`
- Edge function is deployed: Visit Supabase Dashboard > Edge Functions
- Secrets are configured: `supabase secrets list` (check RESEND_API_KEY, QUEUE_PROCESSOR_TOKEN)

**Fix:**

```sql
-- Manually trigger processing
SELECT net.http_post(
  url := 'https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/process-email-queue',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || current_setting('app.settings.queue_processor_token', true),
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object('action', 'process')
);
```

#### 2. High Failure Rate

**Check error messages:**

```sql
SELECT error, COUNT(*) as count
FROM email_queue
WHERE
  status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY error
ORDER BY count DESC;
```

**Common errors:**

- `Invalid email address` - Check to_email format
- `Rate limit exceeded` - Resend API limits hit (check Resend dashboard)
- `Missing environment variable` - Edge function config issue

#### 3. Stuck Processing Jobs

**Auto-reset** runs every 15 minutes, or manually:

```sql
SELECT public.reset_stuck_email_jobs();
```

## Performance Metrics

### Average Processing Time

```sql
SELECT
  email_type,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_seconds,
  MIN(EXTRACT(EPOCH FROM (completed_at - created_at))) as min_seconds,
  MAX(EXTRACT(EPOCH FROM (completed_at - created_at))) as max_seconds
FROM email_queue
WHERE
  status = 'sent'
  AND completed_at > NOW() - INTERVAL '24 hours'
GROUP BY email_type;
```

### Success Rate (Last 24 Hours)

```sql
SELECT
  email_type,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'sent') /
    NULLIF(COUNT(*), 0),
    2
  ) as success_rate_percent
FROM email_queue
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY email_type;
```

## Manual Testing

### Send Test Email

```bash
curl -X POST \
  "https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/test-admin-email" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"to": "your-email@example.com"}'
```

### Queue Test Email

```sql
INSERT INTO email_queue (
  email_type,
  to_email,
  subject,
  data,
  priority,
  status,
  scheduled_at
) VALUES (
  'order_confirmation',
  'test@example.com',
  'Test Order Confirmation',
  jsonb_build_object('orderId', 'test-order-id'),
  'high',
  'pending',
  NOW()
);
```

## Dashboard Integration

For a web-based dashboard, create an API endpoint that calls these monitoring functions:

```typescript
// Example API route: /api/admin/email-queue/stats
const { data, error } = await supabase.rpc('get_email_queue_stats');

// Example API route: /api/admin/email-queue/failed
const { data, error } = await supabase.rpc('get_failed_emails', { days_back: 7 });
```

## Maintenance Schedule

- **Every 5 minutes**: Process email queue (automated)
- **Every 15 minutes**: Reset stuck jobs (automated)
- **Daily at 3 AM**: Cleanup old emails (automated)
- **Weekly**: Review failed emails and error patterns
- **Monthly**: Review success rates and performance metrics

## Support

For issues not covered here:

1. Check Supabase logs: Dashboard > Logs > Functions
2. Check Resend dashboard: https://resend.com/emails
3. Review edge function logs for detailed error messages
