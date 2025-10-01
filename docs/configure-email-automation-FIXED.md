# Email Queue Automation Configuration - FIXED FOR SUPABASE

## ✅ Migration Applied Successfully

The permission issue has been fixed! Instead of using database settings (which require superuser), we now use a secure configuration table.

---

## 🔧 Quick Setup (Copy & Paste into SQL Editor)

Run this **ONE command** in your Supabase SQL Editor:

```sql
-- Update the queue processor token
UPDATE public.system_config
SET value = 'maJFxtscfgw0Sk4cHiC5g+bgi0xyxG6gwNeOuvWhWEg=',
    updated_at = NOW()
WHERE key = 'queue_processor_token';
```

**That's it!** The token is now configured.

---

## ✅ Verify Configuration

### 1. Check Token is Set

```sql
SELECT public.get_config('queue_processor_token') AS token;
```

Expected output: `maJFxtscfgw0Sk4cHiC5g+bgi0xyxG6gwNeOuvWhWEg=`

### 2. Check Cron Jobs Are Active

```sql
SELECT
  jobid,
  jobname,
  schedule,
  active
FROM cron.job
WHERE jobname IN ('process-email-queue', 'reset-stuck-emails', 'cleanup-old-emails')
ORDER BY jobname;
```

Expected output:

```
jobname              | schedule      | active
---------------------|---------------|--------
cleanup-old-emails   | 0 3 * * *     | t
process-email-queue  | */5 * * * *   | t
reset-stuck-emails   | */15 * * * *  | t
```

### 3. Check Monitoring Functions

```sql
SELECT * FROM public.get_email_queue_stats();
```

---

## 🧪 Test the System

### Step 1: Insert Test Email

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
  jsonb_build_object('orderId', gen_random_uuid()::text),
  'high'
) RETURNING id, email_type, status, created_at;
```

### Step 2: Manually Trigger Processing (Instant Test)

```sql
SELECT net.http_post(
  url := 'https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/process-email-queue',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || public.get_config('queue_processor_token'),
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object('action', 'process')
) AS response;
```

### Step 3: Check Email Status

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

The test email should show `status = 'sent'` or `status = 'failed'` (with error details).

### Step 4: Check Queue Stats

```sql
SELECT * FROM public.get_email_queue_stats();
```

### Step 5: Check Cron Execution History

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

## 🎯 What Changed?

### Before (Didn't Work):

```sql
-- Required superuser permissions ❌
ALTER DATABASE postgres SET app.settings.queue_processor_token = 'token';
```

### After (Works in Supabase):

```sql
-- Uses secure config table ✅
UPDATE public.system_config SET value = 'token' WHERE key = 'queue_processor_token';
```

---

## 📊 New Monitoring Features

### View All System Config

```sql
SELECT key, description, created_at, updated_at
FROM public.system_config;
```

### Get Any Config Value

```sql
SELECT public.get_config('queue_processor_token');
```

---

## 🔒 Security

The `system_config` table is protected by Row Level Security (RLS):

- ✅ Only `service_role` can read/write
- ✅ Public users have no access
- ✅ Token is encrypted at rest in Supabase

---

## 🐛 Troubleshooting

### Issue: Test email stuck in "pending"

**Check if cron job is running:**

```sql
SELECT * FROM cron.job WHERE jobname = 'process-email-queue';
```

**Manually trigger processing:**

```sql
SELECT net.http_post(
  url := 'https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/process-email-queue',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || public.get_config('queue_processor_token'),
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object('action', 'process')
);
```

### Issue: Emails failing with authentication error

**Check token is set correctly:**

```sql
SELECT public.get_config('queue_processor_token');
```

Should return: `maJFxtscfgw0Sk4cHiC5g+bgi0xyxG6gwNeOuvWhWEg=`

**Update token if needed:**

```sql
UPDATE public.system_config
SET value = 'maJFxtscfgw0Sk4cHiC5g+bgi0xyxG6gwNeOuvWhWEg='
WHERE key = 'queue_processor_token';
```

### Issue: Can't see cron jobs

**Check if pg_cron extension is enabled:**

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

If missing, enable it (may require support ticket for managed Supabase):

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

---

## ✅ Success Checklist

- [ ] Migration `20251001000003` applied successfully
- [ ] Token updated in `system_config` table
- [ ] Token verification returns correct value
- [ ] Cron jobs are listed and active
- [ ] Test email inserted
- [ ] Manual trigger successful
- [ ] Test email status changed to "sent"
- [ ] Queue stats show correct counts

---

## 🎉 You're All Set!

Your email automation is now fully configured and ready for production!

**How it works:**

1. Order created → Status changes to "confirmed"
2. Database trigger → Email queued automatically
3. pg_cron (every 5 min) → Calls edge function with token
4. Edge function → Processes queue, sends emails via Resend
5. Stuck jobs → Auto-reset every 15 minutes
6. Old emails → Cleaned up daily at 3 AM

**Monitor anytime:**

```sql
SELECT * FROM public.get_email_queue_stats();
```

---

## 📚 Additional Resources

- [Email Queue Monitoring Guide](./email-queue-monitoring.md)
- [Email Queue Setup Guide](./email-queue-setup.md)

---

## 🔑 Token Reference

Your current token (stored in both Supabase secrets and system_config):

```
maJFxtscfgw0Sk4cHiC5g+bgi0xyxG6gwNeOuvWhWEg=
```

**Keep this secure!** Only stored in:

1. Supabase Edge Function secrets
2. Database `system_config` table (RLS protected)
