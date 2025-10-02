# Resend Webhook Configuration

## Overview

This document explains how to configure Resend webhooks to track email delivery events for DankDeals order confirmations.

---

## Webhook Endpoint

**URL**: `https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/resend-webhook`

**Signing Secret**: `whsec_0mIjbLBjaxmyP0dP5Gsu/VxWNY/fUWga`

---

## Configuration Steps

### 1. Log into Resend Dashboard

1. Go to https://resend.com/webhooks
2. Click "Add Endpoint"

### 2. Configure Webhook Endpoint

**Endpoint URL**:

```
https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/resend-webhook
```

**Events to Subscribe**:

- ✅ `email.sent` - Email successfully sent to Resend
- ✅ `email.delivered` - Email delivered to recipient
- ✅ `email.delivery_delayed` - Delivery delayed
- ✅ `email.bounced` - Email bounced (hard/soft)
- ✅ `email.complained` - Spam complaint
- ✅ `email.opened` - Recipient opened email
- ✅ `email.clicked` - Recipient clicked link

**Recommended**: Subscribe to all events for complete tracking

### 3. Copy Signing Secret

After creating the endpoint, Resend will provide a signing secret:

```
whsec_0mIjbLBjaxmyP0dP5Gsu/VxWNY/fUWga
```

This is already configured in the edge function via:

```bash
supabase secrets set RESEND_WEBHOOK_SECRET='whsec_0mIjbLBjaxmyP0dP5Gsu/VxWNY/fUWga'
```

---

## How It Works

### 1. Email Sent via Resend API

When `process-email-queue` sends an email:

```typescript
await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${RESEND_API_KEY}`,
  },
  body: JSON.stringify({
    from: 'orders@dankdealsmn.com',
    to: 'customer@example.com',
    subject: 'Order Confirmed',
    html: '<html>...',
  }),
});
```

### 2. Resend Sends Webhook Events

Resend will POST events to:

```
https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/resend-webhook
```

With headers:

```
svix-id: msg_xxx
svix-timestamp: 1234567890
svix-signature: v1,base64signature
```

### 3. Webhook Verification

The edge function verifies the signature using HMAC SHA256:

```typescript
const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
const signature = HMAC_SHA256(webhookSecret, signedPayload);
```

If signature is valid, the event is processed.

### 4. Event Logging

Events are logged to the `email_logs` table:

```sql
INSERT INTO email_logs (
  email_id,
  event_type,
  event_data,
  to_email,
  from_email,
  subject,
  created_at
) VALUES (...);
```

### 5. Special Handling

**Hard Bounces**:

```typescript
if (event.type === 'email.bounced' && event.data.bounce_type === 'hard') {
  // Add to bounce list to prevent future sends
  await supabase.from('email_bounces').upsert({
    email: event.data.to[0],
    bounce_type: 'hard',
    bounce_reason: event.data.bounce_reason,
  });
}
```

---

## Security

### Signature Verification

The webhook uses **Svix signature verification** to ensure requests come from Resend:

1. Resend signs each request with HMAC SHA256
2. Signature is sent in `svix-signature` header
3. Edge function verifies signature before processing
4. Invalid signatures return `401 Unauthorized`

### Headers Used

```
svix-id: Unique message ID
svix-timestamp: Unix timestamp when webhook was sent
svix-signature: v1,<base64_signature> (can have multiple versions)
```

### Verification Algorithm

```typescript
// 1. Construct signed payload
const payload = `${svixId}.${svixTimestamp}.${rawBody}`;

// 2. Compute HMAC SHA256
const secret = webhookSecret.replace('whsec_', '');
const signature = HMAC_SHA256(secret, payload);

// 3. Compare with provided signatures
const expected = base64(signature);
const provided = svixSignature.split(' ').map((s) => s.split(',')[1]);
return provided.includes(expected);
```

---

## Monitoring

### Check Webhook Logs

**Via Supabase Dashboard**:

```
Functions → resend-webhook → Invocations
```

**Via SQL**:

```sql
-- Check recent webhook events
SELECT
  event_type,
  to_email,
  subject,
  created_at
FROM email_logs
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- Check bounce rate
SELECT
  event_type,
  COUNT(*) as count
FROM email_logs
GROUP BY event_type
ORDER BY count DESC;

-- Check hard bounces
SELECT
  email,
  bounce_type,
  bounce_reason,
  bounced_at
FROM email_bounces
ORDER BY bounced_at DESC;
```

### Test Webhook

Send a test webhook from Resend dashboard:

1. Go to Webhooks → Your endpoint
2. Click "Send test event"
3. Check edge function logs for:
   ```
   Webhook signature verified successfully
   Resend webhook received: { type: 'email.sent', ... }
   ```

---

## Troubleshooting

### Issue: 401 Invalid Signature

**Cause**: Webhook secret mismatch or incorrect verification

**Fix**:

1. Verify secret in Resend dashboard matches:
   ```bash
   supabase secrets list | grep RESEND_WEBHOOK_SECRET
   ```
2. Check edge function logs for detailed error
3. Ensure signing secret is exactly as shown (including `whsec_` prefix)

### Issue: Events Not Logged

**Cause**: `email_logs` table doesn't exist

**Fix**: Create table:

```sql
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB,
  to_email TEXT,
  from_email TEXT,
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Issue: Hard Bounces Not Tracked

**Cause**: `email_bounces` table doesn't exist

**Fix**: Create table:

```sql
CREATE TABLE IF NOT EXISTS email_bounces (
  email TEXT PRIMARY KEY,
  bounce_type TEXT,
  bounce_reason TEXT,
  bounced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Event Types Reference

| Event                    | Description                  | When It Fires                             |
| ------------------------ | ---------------------------- | ----------------------------------------- |
| `email.sent`             | Email accepted by Resend     | Immediately after API call                |
| `email.delivered`        | Email delivered to inbox     | When recipient server accepts             |
| `email.delivery_delayed` | Delivery temporarily delayed | Recipient server busy/issues              |
| `email.bounced`          | Email bounced                | Hard: Invalid email<br>Soft: Mailbox full |
| `email.complained`       | Marked as spam               | Recipient clicks "Report Spam"            |
| `email.opened`           | Email opened                 | Recipient views email                     |
| `email.clicked`          | Link clicked                 | Recipient clicks tracked link             |

---

## Next Steps

After webhook is configured:

1. ✅ Create test order on production site
2. ✅ Verify email sent via Resend
3. ✅ Check webhook events in `email_logs` table
4. ✅ Monitor bounce rate in `email_bounces` table
5. ✅ Set up alerts for high bounce rates

---

## Configuration Summary

**✅ Webhook URL**: `https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/resend-webhook`

**✅ Signing Secret**: Set as `RESEND_WEBHOOK_SECRET` environment variable

**✅ Signature Verification**: Enabled using Svix HMAC SHA256

**✅ Event Logging**: Events stored in `email_logs` table

**✅ Bounce Tracking**: Hard bounces tracked in `email_bounces` table

**Status**: Ready for production use
