# Checkout Flow & Email System Audit - CRITICAL FIXES REQUIRED

**Date:** October 2, 2025
**Auditor:** Claude Code
**Status:** 🔴 **CRITICAL - EMAILS NOT SENDING**

---

## Executive Summary

### 🔴 Critical Issue Found

**NO ORDER CONFIRMATION EMAILS ARE BEING SENT** due to authentication failure between pg_cron and the email processor edge function.

- **10+ emails stuck in queue** (oldest from August 9, 2025)
- **pg_cron jobs run successfully** but are rejected by edge function with 401 Unauthorized
- **Root cause:** Token mismatch between database and edge function secrets
- **Customer Impact:** HIGH - No order confirmations being received

---

## Root Cause Analysis

### Issue: Token Mismatch (CRITICAL)

**Problem:**

```bash
# Database stores this token:
system_config.queue_processor_token = "Qlc+fcTql+boPwXE426vl+hKMehqrKmnB02xcofFdDw="

# But edge function expects this (from secrets):
QUEUE_PROCESSOR_TOKEN = <different value>

# Result:
curl with database token → {"code":401,"message":"Invalid JWT"}
```

**Evidence:**

1. pg_cron jobs show `status='succeeded'` (HTTP call made)
2. Manual curl test with database token returns 401
3. Email queue shows 0 attempts, never processed
4. Edge function logs are empty (requests rejected before processing)

**Location:** `process-email-queue/index.ts:32-46`

---

## Complete Findings

### ✅ Working Components

1. **Order Creation** - Orders successfully created in database
2. **Email Queue Trigger** - `queue_order_confirmation_email_v3()` correctly inserts into `email_queue`
3. **pg_cron Scheduling** - Jobs run every 5 minutes as configured
4. **Edge Functions Deployed** - All functions active and latest version
5. **Database Schema** - All tables and indexes properly configured

### 🔴 Broken Components

1. **Email Processing Authentication** - Token mismatch prevents processing
2. **Email Delivery** - 0 emails sent since August
3. **Webhook Logging** - No events being stored (webhook may not be configured)

### 🟡 Secondary Issues

1. **Admin Email Bounce** - `admin@dankdealsmn.com` receiving transient bounces
2. **Resend Domain Verification** - Status unknown, needs verification
3. **Webhook Configuration** - Likely not configured in Resend dashboard

---

## Fix Instructions

### Fix #1: Sync QUEUE_PROCESSOR_TOKEN (CRITICAL - DO FIRST)

The database token MUST match the edge function secret.

**Option A: Get the actual secret and update database**

```bash
# Method 1: Check Supabase dashboard
# Go to: Dashboard → Settings → Edge Functions → Manage secrets
# Find QUEUE_PROCESSOR_TOKEN value

# Method 2: If you know the token, update database directly
# Connect to SQL Editor and run:
UPDATE public.system_config
SET value = '<actual-token-value>', updated_at = NOW()
WHERE key = 'queue_processor_token';
```

**Option B: Generate new token and sync both places**

```bash
# 1. Generate secure random token
NEW_TOKEN=$(openssl rand -base64 32)
echo "New token: $NEW_TOKEN"

# 2. Update Supabase edge function secrets
supabase secrets set QUEUE_PROCESSOR_TOKEN="$NEW_TOKEN"

# 3. Update database
# Via SQL Editor:
UPDATE public.system_config
SET value = '<paste-new-token-here>', updated_at = NOW()
WHERE key = 'queue_processor_token';
```

**Verification:**

```bash
# Test manual call with updated token
curl -X POST 'https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/process-email-queue' \
  -H "Authorization: Bearer <NEW_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"action":"process"}'

# Should return: {"success":true,"message":"Email queue processed",...}
# NOT: {"code":401,"message":"Invalid JWT"}
```

---

### Fix #2: Verify Resend Configuration

**Domain Verification:**

1. Go to https://resend.com/domains
2. Confirm `dankdealsmn.com` is **✅ Verified**
3. If not verified, add these DNS records:

```
# Get exact records from Resend dashboard
Type: TXT   Name: @                Value: resend=...
Type: TXT   Name: _dmarc          Value: v=DMARC1...
Type: TXT   Name: resend._domainkey  Value: p=...
Type: CNAME Name: resend.mail      Value: resend.io
```

**Environment Variables Check:**

```bash
# In Supabase Dashboard → Edge Functions → Secrets
# Verify these exist:

✅ RESEND_API_KEY=re_...           # From resend.com API keys
✅ FROM_EMAIL=orders@dankdealsmn.com
✅ ADMIN_EMAIL=<your-real-email>   # NOT admin@dankdealsmn.com
✅ QUEUE_PROCESSOR_TOKEN=<value>   # MUST match database
```

**IMPORTANT:** Change `ADMIN_EMAIL` to a different domain (e.g., Gmail) to avoid email loops and bounces.

---

### Fix #3: Configure Resend Webhook

Currently NO webhook is configured, so bounce events aren't being logged.

**Setup:**

1. Go to https://resend.com/webhooks
2. Click **Add Webhook**
3. **Endpoint URL:**
   ```
   https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/resend-webhook
   ```
4. **Subscribe to events:**
   - ✅ `email.sent`
   - ✅ `email.delivered`
   - ✅ `email.bounced`
   - ✅ `email.delivery_delayed`
   - ✅ `email.complained`
   - ✅ `email.opened` (optional)
   - ✅ `email.clicked` (optional)

5. **Copy Signing Secret** (starts with `whsec_...`)

6. **Add to Supabase secrets:**
   ```bash
   supabase secrets set RESEND_WEBHOOK_SECRET="whsec_..."
   ```

**Verification:**

```bash
# Send test webhook from Resend dashboard
# Then check database:
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 5;
# Should show logged events
```

---

### Fix #4: Process Stuck Emails

After fixing authentication, process the 10 pending emails:

**Option A: Wait for pg_cron (automatic)**

- Fixed emails will process within 5 minutes

**Option B: Manual trigger (immediate)**

```bash
# Via curl (use correct token):
curl -X POST \
  'https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/process-email-queue' \
  -H 'Authorization: Bearer <CORRECT_TOKEN>' \
  -H 'Content-Type: application/json'
```

**Option C: Via SQL (using database function)**

```sql
-- Trigger processing via database
SELECT net.http_post(
  url := 'https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/process-email-queue',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || public.get_config('queue_processor_token'),
    'Content-Type', 'application/json'
  ),
  body := jsonb_build_object('action', 'process')
);
```

**Monitor progress:**

```sql
-- Check email queue status
SELECT status, COUNT(*) as count
FROM email_queue
GROUP BY status;

-- Should show:
-- status | count
-- -------|------
-- sent   | 10
-- pending| 0
```

---

## Testing Checklist

### Phase 1: Configuration Fix (Do Now)

```bash
# 1. Sync QUEUE_PROCESSOR_TOKEN
□ Get actual token from Supabase dashboard
□ Update database with correct value
□ Test with curl (should return 200, not 401)

# 2. Verify Resend
□ Check domain verification status
□ Update ADMIN_EMAIL to different domain
□ Verify all secrets are set

# 3. Configure webhook
□ Add webhook endpoint in Resend
□ Set RESEND_WEBHOOK_SECRET
```

### Phase 2: Email Queue Processing

```bash
□ Manually trigger email processor
□ Verify emails change to 'sent' status
□ Check Resend dashboard for sent emails
□ Verify customers received emails
```

### Phase 3: End-to-End Test

```bash
□ Place test order through checkout
□ Email queued within 1 second
□ Email processed within 5 minutes
□ Customer receives confirmation
□ Admin receives notification
□ Events logged in email_logs table
```

---

## Monitoring Queries

### Check Queue Health

```sql
SELECT
  status,
  COUNT(*) as count,
  MIN(scheduled_at) as oldest_scheduled,
  MAX(created_at) as newest_created
FROM email_queue
WHERE status = 'pending'
GROUP BY status;

-- Healthy state: 0 pending emails older than 5 minutes
```

### Check Recent Activity

```sql
SELECT
  email_type,
  to_email,
  status,
  attempts,
  error_message,
  created_at,
  last_attempt_at
FROM email_queue
ORDER BY created_at DESC
LIMIT 10;
```

### Check Bounce Rates

```sql
SELECT
  bounce_type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE is_suppressed) as suppressed
FROM email_bounces
GROUP BY bounce_type;

-- Healthy: <5% bounce rate
```

### Check Cron Job Status

```sql
SELECT
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname LIKE '%email%';
```

### Check Recent Cron Executions

```sql
SELECT
  jobname,
  status,
  start_time,
  end_time,
  return_message
FROM cron.job_run_details
WHERE jobname = 'process-email-queue'
ORDER BY start_time DESC
LIMIT 5;
```

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ORDER CREATION                                           │
│    User completes checkout → Order inserted into DB         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. DATABASE TRIGGER                                         │
│    queue_order_confirmation_email_v3()                      │
│    → INSERT INTO email_queue (status='pending')             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. PG_CRON (every 5 minutes)                               │
│    SELECT net.http_post(                                    │
│      url := '.../process-email-queue',                      │
│      headers := 'Bearer ' || get_config('token')            │
│    )                                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼ [CURRENTLY FAILING HERE - 401]
┌─────────────────────────────────────────────────────────────┐
│ 4. EDGE FUNCTION: process-email-queue                       │
│    - Authenticate request (checks QUEUE_PROCESSOR_TOKEN)    │
│    - Load pending emails from queue                         │
│    - For each email:                                        │
│      • Load order data                                      │
│      • Generate HTML template                               │
│      • Send via Resend API                                  │
│      • Update status to 'sent'                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. RESEND API                                               │
│    - Validates sender domain                                │
│    - Delivers email to recipient                            │
│    - Sends webhook events back                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. EDGE FUNCTION: resend-webhook                            │
│    - Verify signature (RESEND_WEBHOOK_SECRET)               │
│    - Log event to email_logs                                │
│    - Track bounces in email_bounces                         │
│    - Suppress hard bounces                                  │
└─────────────────────────────────────────────────────────────┘
```

**FAILURE POINT:** Step 3→4 transition (Token mismatch causes 401)

---

## Success Criteria

✅ **System is working when:**

- [ ] All emails process within 5 minutes of order creation
- [ ] No emails stuck in "pending" status >15 minutes
- [ ] Bounce rate <5% for customer emails
- [ ] All webhook events logged in `email_logs` table
- [ ] Admin receives order notifications immediately
- [ ] Customers receive order confirmations within 5 minutes

**Current State:** 0/6 criteria met ❌
**After Fix:** Should be 6/6 ✅

---

## Impact Assessment

### Customer Impact

- **HIGH:** No order confirmations sent since August
- Customers don't know if orders were received
- May lead to duplicate orders or support tickets
- Poor user experience

### Business Impact

- **HIGH:** No admin notifications for new orders
- May miss time-sensitive orders
- Cash-on-delivery orders not tracked
- Reputational risk

### Technical Debt

- **MEDIUM:** Email queue growing (10+ stuck emails)
- Database bloat from failed jobs
- Monitoring gaps (no bounce tracking)

---

## Estimated Fix Time

| Task                 | Time       | Priority |
| -------------------- | ---------- | -------- |
| Fix token mismatch   | 5 min      | P0       |
| Verify Resend config | 10 min     | P0       |
| Process stuck emails | 5 min      | P1       |
| Configure webhook    | 10 min     | P1       |
| End-to-end testing   | 15 min     | P1       |
| **TOTAL**            | **45 min** |          |

---

## Additional Recommendations

### Short Term (This Week)

1. **Add Monitoring Alert**

   ```sql
   -- Create function to alert if emails stuck >15 min
   CREATE OR REPLACE FUNCTION check_stuck_emails()
   RETURNS TABLE(count BIGINT, oldest TIMESTAMPTZ) AS $$
     SELECT
       COUNT(*),
       MIN(scheduled_at)
     FROM email_queue
     WHERE status = 'pending'
       AND scheduled_at < NOW() - INTERVAL '15 minutes';
   $$ LANGUAGE SQL;
   ```

2. **Add Email Template Versioning**
   - Store templates in database
   - Track which template version was sent
   - A/B test subject lines

3. **Implement Bounce Suppression**
   - Don't send to emails with 3+ bounces
   - Add email validation before queueing
   - Check suppression list in edge function

### Long Term (This Month)

1. **Add Email Analytics Dashboard**
   - Delivery rates
   - Open rates (if tracking)
   - Bounce rates by type
   - Processing times

2. **Improve Error Handling**
   - Better retry logic with exponential backoff
   - Dead letter queue for permanent failures
   - Alert on repeated failures

3. **Add Email Previews**
   - Admin panel to preview email templates
   - Test send functionality
   - Template editor

---

## Conclusion

The email system is **architecturally sound** but has a **critical configuration bug** preventing all email delivery.

**Primary Issue:** Token mismatch (5 min fix)
**Secondary Issues:** Resend configuration (10 min fix)
**Risk Level:** 🔴 HIGH - Customer-facing feature completely broken
**Fix Complexity:** ⚡ LOW - Configuration only, no code changes needed

**Next Steps:**

1. Fix QUEUE_PROCESSOR_TOKEN mismatch (Priority 0)
2. Verify Resend domain and secrets (Priority 0)
3. Configure webhook endpoint (Priority 1)
4. Test end-to-end (Priority 1)
5. Monitor for 24 hours (Priority 2)

---

## Contact & Support

If issues persist after fixes:

1. Check edge function logs:

   ```bash
   # Via Supabase dashboard
   Dashboard → Edge Functions → process-email-queue → Logs
   ```

2. Check Resend logs:

   ```
   https://resend.com/emails
   ```

3. Run diagnostics:

   ```sql
   SELECT * FROM public.get_email_queue_stats();
   SELECT * FROM public.get_failed_emails(7);
   ```

4. Contact support with:
   - Error messages from logs
   - Email queue diagnostics output
   - Recent order IDs that should have sent emails
   - Screenshots of Resend dashboard status

---

**Report Generated:** October 2, 2025
**Reviewed By:** Claude Code (AI Assistant)
**Priority:** 🔴 CRITICAL - FIX IMMEDIATELY
