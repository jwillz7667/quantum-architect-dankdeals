# Email System & Checkout Flow Audit Report

**Date:** October 2, 2025
**Status:** 🔴 **CRITICAL ISSUES FOUND**

---

## Executive Summary

The email confirmation system has **critical failures** preventing order confirmation emails from being sent. 10 emails are stuck in the queue (oldest from August 9), and the bounce you received indicates domain/authentication issues with Resend.

### Critical Issues

1. 🔴 **Emails Not Being Processed** - 10 emails stuck in "pending" status with 0 attempts
2. 🔴 **Sender Domain Issue** - Bounce on `admin@dankdealsmn.com` suggests DNS/SPF problems
3. 🔴 **Webhook Not Logging** - No bounce events being stored in database
4. 🟡 **Queue Processing Not Executing** - Cron job runs but doesn't process emails

---

## Issue #1: Email Queue Stuck (CRITICAL)

### Current State

```sql
10 emails in queue, all status='pending', attempts=0
- Oldest: Aug 9, 2025 (54 days stuck!)
- Newest: Oct 1, 2025
- None have been sent
- Cron job runs every 5 minutes but does nothing
```

### Root Cause Analysis

**Problem:** The email queue processor is NOT processing emails despite cron job running.

**Possible Causes:**

1. ❌ **QUEUE_PROCESSOR_TOKEN mismatch** - Edge function auth failing
2. ❌ **Missing FROM_EMAIL environment variable** - Function fails on init
3. ❌ **RESEND_API_KEY invalid or expired** - API calls failing
4. ❌ **Email validation rejecting addresses** - Filtering out all recipients

### Investigation Needed

The cron job code shows:

```sql
SELECT net.http_post(
  url := 'https://...supabase.co/functions/v1/process-email-queue',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || public.get_config('queue_processor_token'),
    ...
  )
);
```

**Check:** Is `get_config('queue_processor_token')` returning the correct value?

---

## Issue #2: Sender Domain Bounce (CRITICAL)

### Error Received

```json
{
  "type": "email.bounced",
  "data": {
    "bounce": {
      "type": "Transient",
      "subType": "General",
      "message": "The recipient's email provider sent a general bounce..."
    },
    "from": "DankDeals <orders@dankdealsmn.com>",
    "to": ["admin@dankdealsmn.com"]
  }
}
```

### Analysis

**Transient Bounce = Temporary Failure**

- Email server rejected the message temporarily
- Could be DNS issues, inbox full, or temporary server problems
- **Action:** Can retry sending

### Likely Root Causes

#### 1. Domain Not Verified in Resend ⚠️

**Check in Resend Dashboard:**

- Go to https://resend.com/domains
- Verify `dankdealsmn.com` is listed and **verified**
- Check DNS records are properly configured:
  - SPF record: `v=spf1 include:_spf.resend.com ~all`
  - DKIM records (provided by Resend)
  - DMARC record (optional but recommended)

#### 2. Recipient Email Issue ⚠️

**Problem:** Sending TO `admin@dankdealsmn.com` FROM `orders@dankdealsmn.com`

This creates a loop and many email servers reject this pattern.

**Solution:** Use a different admin email for testing:

- Change `ADMIN_EMAIL` to a real inbox (Gmail, etc.)
- Don't send admin notifications to the same domain as sender

#### 3. Email Service Configuration

The code shows:

```typescript
this.fromEmail = Deno.env.get('FROM_EMAIL') || 'orders@dankdealsmn.com';
this.adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@dankdealsmn.com';
```

**Verify Environment Variables:**

```bash
# In Supabase Dashboard → Settings → Edge Functions → Secrets
FROM_EMAIL=orders@dankdealsmn.com
ADMIN_EMAIL=your-real-email@gmail.com  # ← Change this!
RESEND_API_KEY=re_xxxxx...
```

---

## Issue #3: Webhook Not Storing Events (HIGH)

### Problem

```sql
SELECT * FROM email_logs;
-- Returns: 0 rows

SELECT * FROM email_bounces;
-- Returns: 0 rows
```

**Despite receiving bounces**, nothing is being logged.

### Root Causes

#### 1. Webhook Not Configured in Resend

**Setup Required:**

1. Go to Resend Dashboard → Webhooks
2. Add webhook endpoint:
   ```
   https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/resend-webhook
   ```
3. Subscribe to events:
   - ✅ `email.sent`
   - ✅ `email.delivered`
   - ✅ `email.bounced`
   - ✅ `email.delivery_delayed`
   - ✅ `email.complained`

#### 2. Webhook Secret Not Configured

The code checks for signature verification:

```typescript
const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');
```

**Setup:**

1. Copy webhook signing secret from Resend
2. Add to Supabase: `RESEND_WEBHOOK_SECRET=whsec_xxxxx...`

#### 3. Data Type Mismatch in email_bounces

Current schema expects `bounced_at` timestamp, but Resend sends `data.bounced_at`.

**Potential Fix:**

```typescript
// In resend-webhook/index.ts line 172-177
await supabase.from('email_bounces').upsert({
  email: Array.isArray(event.data.to) ? event.data.to[0] : event.data.to,
  bounce_type: event.data.bounce_type, // ← May not exist
  bounce_reason: event.data.bounce_reason, // ← May not exist
  bounced_at: event.data.bounced_at, // ← May not exist
});
```

**Issue:** The webhook payload shows `bounce` object but code expects flat `bounce_type`.

---

## Issue #4: Email Data Structure

### Problem: Queue vs Processor Mismatch

**Email Queue Table:**

```sql
- email_type: 'order_confirmation'
- data: { orderId: '...', orderNumber: '...' }
```

**Processor Expects:**

```typescript
case 'ORDER_CONFIRMATION':
case 'order_confirmation':
  await emailService.sendOrderConfirmation(order);
```

**Code Flow:**

1. ✅ Trigger inserts into `email_queue` with `email_type='order_confirmation'`
2. ✅ Cron job calls `process-email-queue` edge function
3. ❓ Edge function authenticates with token
4. ❓ Processor loads queue entries
5. ❓ Processor sends via Resend API
6. ❌ **FAILING SOMEWHERE IN STEPS 3-5**

---

## Recommended Fixes

### Fix #1: Verify Edge Function Configuration

**Check Environment Variables (Supabase Dashboard → Settings → Edge Functions):**

```bash
# Required for ALL edge functions:
SUPABASE_URL=https://ralbzuvkyexortqngvxs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # From Settings → API
SUPABASE_ANON_KEY=eyJ...

# Required for email processing:
RESEND_API_KEY=re_xxxxx...        # From resend.com
FROM_EMAIL=orders@dankdealsmn.com
ADMIN_EMAIL=your-real-email@gmail.com  # ← CHANGE THIS
QUEUE_PROCESSOR_TOKEN=<secure-random-token>

# Required for webhook:
RESEND_WEBHOOK_SECRET=whsec_xxxxx...  # From Resend webhook config
```

### Fix #2: Update Admin Email Configuration

**DO NOT send admin notifications to the same domain as sender.**

**Current (BAD):**

```
FROM: orders@dankdealsmn.com
TO:   admin@dankdealsmn.com  ❌ SAME DOMAIN
```

**Fix (GOOD):**

```
FROM: orders@dankdealsmn.com
TO:   your-personal@gmail.com  ✅ DIFFERENT DOMAIN
```

**Update in Supabase:**

```sql
-- Or set via environment variable ADMIN_EMAIL
```

### Fix #3: Verify Domain in Resend

1. Go to https://resend.com/domains
2. Verify `dankdealsmn.com` shows ✅ **Verified**
3. If not verified, add DNS records from Resend dashboard

### Fix #4: Configure Resend Webhook

1. Go to https://resend.com/webhooks
2. Click "Add Webhook"
3. **Endpoint URL:**
   ```
   https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/resend-webhook
   ```
4. **Events to subscribe:**
   - email.sent
   - email.delivered
   - email.bounced
   - email.delivery_delayed
   - email.complained

5. Copy the **Signing Secret** (whsec\_...)
6. Add to Supabase: `RESEND_WEBHOOK_SECRET=whsec_xxxxx...`

### Fix #5: Manual Email Queue Flush

After fixing configuration, manually trigger processing:

```bash
# Via curl (or Postman):
curl -X POST \
  'https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/process-email-queue' \
  -H 'Authorization: Bearer <YOUR_QUEUE_PROCESSOR_TOKEN>' \
  -H 'Content-Type: application/json'
```

Or trigger via SQL:

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

### Fix #6: Fix Webhook Bounce Handling

**Update:** `supabase/functions/resend-webhook/index.ts` line 164-178

```typescript
case 'email.bounced':
  console.log(
    `Email bounced: ${event.data.email_id}, type: ${event.data.bounce?.type}, reason: ${event.data.bounce?.message}`
  );

  // Extract bounce info from nested object
  const bounceInfo = event.data.bounce || {};

  // Track bounces in database
  await supabase.from('email_bounces').upsert({
    email: Array.isArray(event.data.to) ? event.data.to[0] : event.data.to,
    bounce_type: bounceInfo.type || 'unknown',      // 'Transient' or 'Permanent'
    bounce_reason: bounceInfo.message || bounceInfo.subType || 'Unknown',
    first_bounced_at: event.created_at,
    last_bounced_at: event.created_at,
    bounce_count: 1,
    is_suppressed: bounceInfo.type === 'Permanent',  // Hard bounces = suppress
  }, {
    onConflict: 'email',  // Update if exists
  });

  // For hard bounces, increment count
  if (bounceInfo.type === 'Permanent') {
    await supabase.rpc('increment', {
      table: 'email_bounces',
      column: 'bounce_count',
      filter: { email: event.data.to[0] }
    });
  }
  break;
```

---

## Testing Checklist

### Phase 1: Configuration Verification

- [ ] Verify `RESEND_API_KEY` is set and valid
- [ ] Verify `FROM_EMAIL` is set to `orders@dankdealsmn.com`
- [ ] Change `ADMIN_EMAIL` to a different domain (Gmail, etc.)
- [ ] Verify `QUEUE_PROCESSOR_TOKEN` matches between edge function and database
- [ ] Verify domain `dankdealsmn.com` is verified in Resend dashboard
- [ ] Configure Resend webhook with correct endpoint and secret

### Phase 2: Manual Queue Processing

- [ ] Trigger edge function manually via curl or Supabase dashboard
- [ ] Check logs for errors: `Dashboard → Edge Functions → process-email-queue → Logs`
- [ ] Verify emails change from `pending` to `sent` status
- [ ] Check Resend dashboard for sent emails

### Phase 3: End-to-End Test

- [ ] Place a test order through checkout
- [ ] Verify email queued: `SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 1`
- [ ] Wait 5 minutes for cron to trigger
- [ ] Verify email sent: Check `status='sent'` and `sent_at` populated
- [ ] Check inbox for order confirmation email

### Phase 4: Webhook Verification

- [ ] Send test email from Resend dashboard
- [ ] Check `email_logs` table for logged events
- [ ] Trigger a test bounce and verify `email_bounces` table updated

---

## Monitoring Queries

### Check Queue Health

```sql
SELECT
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM email_queue
GROUP BY status;
```

### Check Recent Email Activity

```sql
SELECT
  eq.email_type,
  eq.to_email,
  eq.status,
  eq.attempts,
  eq.created_at,
  eq.sent_at,
  eq.error_message as error
FROM email_queue eq
ORDER BY eq.created_at DESC
LIMIT 10;
```

### Check Bounce Rates

```sql
SELECT
  bounce_type,
  COUNT(*) as count,
  COUNT(CASE WHEN is_suppressed THEN 1 END) as suppressed
FROM email_bounces
GROUP BY bounce_type;
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

---

## Architecture Diagram

```
┌─────────────────┐
│  Order Created  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ Database Trigger            │
│ queue_order_email_v3()      │
│ Inserts into email_queue    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ pg_cron (every 5 min)       │
│ Calls process-email-queue   │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Edge Function:              │
│ process-email-queue         │
│ - Loads pending emails      │
│ - Sends via Resend API      │
│ - Updates status to 'sent'  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Resend API                  │
│ - Delivers email            │
│ - Sends webhook events      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Edge Function:              │
│ resend-webhook              │
│ - Logs events to email_logs │
│ - Tracks bounces            │
└─────────────────────────────┘
```

**CURRENT FAILURE POINT:** Likely between pg_cron and Edge Function (auth or config issue)

---

## Immediate Action Items

### Priority 1 (Do Now)

1. ✅ **Change ADMIN_EMAIL** to a real external email address
2. ✅ **Verify RESEND_API_KEY** is set in edge function secrets
3. ✅ **Verify domain** in Resend dashboard (dankdealsmn.com)
4. ✅ **Check edge function logs** for errors

### Priority 2 (Do Today)

1. ✅ **Configure Resend webhook** with correct endpoint
2. ✅ **Manually trigger** email queue processing
3. ✅ **Test order confirmation** end-to-end
4. ✅ **Fix bounce tracking** code in resend-webhook

### Priority 3 (Do This Week)

1. ✅ **Add monitoring** for stuck emails (alert if pending >15 min)
2. ✅ **Add retry logic** for failed emails
3. ✅ **Implement bounce suppression** (don't send to hard bounces)
4. ✅ **Add email templates** with better formatting

---

## Success Criteria

✅ **System is healthy when:**

- All emails process within 5 minutes of queuing
- No emails stuck in "pending" >15 minutes
- Bounce rate <5%
- All webhook events logged in database
- Admin receives order notifications within 5 minutes
- Customers receive confirmations immediately after order

---

## Conclusion

The email system is **architecturally sound** but has **critical configuration issues**:

1. 🔴 **Configuration**: Edge function env vars likely missing/incorrect
2. 🔴 **Domain**: Possible DNS or Resend verification issue
3. 🔴 **Webhook**: Not configured, causing silent failures
4. 🟡 **Code**: Bounce handling needs minor fix

**Estimated Fix Time:** 30-60 minutes
**Risk Level:** HIGH (customers not receiving order confirmations)

**Next Step:** Follow Priority 1 action items above and test manually.
