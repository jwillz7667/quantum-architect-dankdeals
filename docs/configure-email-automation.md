# Email Queue Automation Configuration

## ✅ Step 1: Token Generated and Set

Your new secure queue processor token has been generated and saved to Supabase secrets:

```
Token: maJFxtscfgw0Sk4cHiC5g+bgi0xyxG6gwNeOuvWhWEg=
```

**⚠️ IMPORTANT: Keep this token secure! It's already saved in your Supabase secrets.**

---

## 🔧 Step 2: Configure Database Setting

Copy and paste this SQL into your **Supabase SQL Editor**:

```sql
-- Set the queue processor token for pg_cron automation
ALTER DATABASE postgres SET app.settings.queue_processor_token = 'maJFxtscfgw0Sk4cHiC5g+bgi0xyxG6gwNeOuvWhWEg=';
```

### How to access SQL Editor:

1. Go to https://supabase.com/dashboard
2. Select your project: `ralbzuvkyexortqngvxs`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Paste the SQL above
6. Click **Run** (or press Cmd/Ctrl + Enter)

---

## ✅ Step 3: Verify Configuration

Run these verification queries in the SQL Editor:

### 3.1 Check Token is Set

```sql
SELECT current_setting('app.settings.queue_processor_token', true) AS token_set;
```

Expected output: Should return your token value

### 3.2 Check Cron Jobs Are Scheduled

```sql
SELECT
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname IN ('process-email-queue', 'reset-stuck-emails', 'cleanup-old-emails');
```

Expected output:

```
jobname              | schedule      | active
---------------------|---------------|--------
process-email-queue  | */5 * * * *   | true
reset-stuck-emails   | */15 * * * *  | true
cleanup-old-emails   | 0 3 * * *     | true
```

### 3.3 Check Monitoring Functions

```sql
SELECT * FROM public.get_email_queue_stats();
```

Expected output:

```
status      | count | oldest_pending | newest_pending
------------|-------|----------------|----------------
pending     | 0     | null           | null
sent        | X     | null           | null
```

---

## 🧪 Step 4: Test the System

### Test 1: Insert Test Email

```sql
INSERT INTO email_queue (
  email_type,
  to_email,
  subject,
  data,
  priority
) VALUES (
  'order_confirmation',
  'test@example.com',
  'Test Order Confirmation',
  jsonb_build_object('orderId', gen_random_uuid()),
  'high'
);
```

### Test 2: Check Queue Status

```sql
SELECT
  id,
  email_type,
  to_email,
  status,
  attempts,
  created_at,
  completed_at
FROM email_queue
ORDER BY created_at DESC
LIMIT 5;
```

### Test 3: Manually Trigger Processing (Optional)

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

### Test 4: Wait 5 Minutes

The cron job runs every 5 minutes. After waiting, check the status again:

```sql
SELECT * FROM public.get_email_queue_stats();
```

The test email should move from `pending` to `sent`.

### Test 5: Check Cron Execution History

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

---

## 🎯 Step 5: Test with Real Order Email

### Send Test Admin Email

```bash
curl -X POST \
  "https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/test-admin-email" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbGJ6dXZreWV4b3J0cW5ndnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTk3NzEsImV4cCI6MjA2Njk3NTc3MX0.QRWwsrZGHY4HLFOlRpygtJDDd1DAJ2rBwDOt1e1m-sA"
```

Expected response:

```json
{
  "success": true,
  "status": 200,
  "body": {
    "id": "email-id-here"
  }
}
```

---

## ✅ Success Checklist

- [ ] Token set in Supabase secrets
- [ ] Database setting configured (`ALTER DATABASE...`)
- [ ] Token verification successful
- [ ] Cron jobs are scheduled and active
- [ ] Monitoring functions working
- [ ] Test email inserted
- [ ] Test email processed successfully
- [ ] Cron job execution history shows successful runs

---

## 🐛 Troubleshooting

### Issue: Token verification returns NULL

**Solution:** Re-run the `ALTER DATABASE` command in SQL Editor

### Issue: Cron jobs not listed

**Solution:** Check if pg_cron extension is enabled:

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

If not enabled:

```sql
CREATE EXTENSION pg_cron;
```

### Issue: Emails stuck in "pending"

**Solutions:**

1. Check cron job is active: `SELECT * FROM cron.job WHERE jobname = 'process-email-queue';`
2. Manually trigger: Run Test 3 above
3. Check edge function logs in Supabase Dashboard → Edge Functions → process-email-queue → Logs

### Issue: Emails failing

**Solution:** Check error messages:

```sql
SELECT
  id,
  email_type,
  to_email,
  status,
  attempts,
  error,
  last_attempt_at
FROM email_queue
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📚 Additional Resources

- [Email Queue Setup Guide](./email-queue-setup.md)
- [Email Queue Monitoring Guide](./email-queue-monitoring.md)
- [Supabase pg_cron Documentation](https://supabase.com/docs/guides/database/extensions/pg_cron)

---

## 🎉 You're Done!

Your automated email queue system is now configured and ready for production!

**What happens next:**

1. When an order is created with status "confirmed", an email is automatically queued
2. Every 5 minutes, the cron job processes pending emails
3. Both customer and admin receive order confirmation emails
4. Stuck jobs are auto-reset every 15 minutes
5. Old emails are cleaned up daily at 3 AM

Monitor your queue health anytime with:

```sql
SELECT * FROM public.get_email_queue_stats();
```
