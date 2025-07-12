# Order Confirmation Email Setup

This guide covers the setup of automated order confirmation emails for DankDeals.

## Overview

The system sends two emails when an order is confirmed:
1. **Customer Email**: Order confirmation with details and next steps
2. **Admin Email**: Alert for immediate action with all order information

## Components

### 1. Edge Functions

#### `send-order-emails`
- Location: `supabase/functions/send-order-emails/index.ts`
- Purpose: Sends order confirmation emails to customers and admin
- Trigger: Called when order status changes to 'confirmed'

#### `process-email-queue`
- Location: `supabase/functions/process-email-queue/index.ts`
- Purpose: Processes queued emails with retry logic
- Trigger: Can be called via cron job or webhook

### 2. Database Components

#### `email_queue` table
Stores pending emails with retry logic:
- `order_id`: Reference to the order
- `email_type`: Type of email (order_confirmation, etc.)
- `status`: pending, processing, sent, failed
- `attempts`: Number of send attempts
- `error_message`: Last error if failed

#### Trigger: `queue_order_email`
Automatically queues emails when order status changes to 'confirmed'

## Setup Instructions

### 1. Deploy Database Migration

```bash
supabase db push
```

### 2. Deploy Edge Functions

```bash
# Deploy send-order-emails function
supabase functions deploy send-order-emails

# Deploy process-email-queue function
supabase functions deploy process-email-queue
```

### 3. Set Environment Variables

In your Supabase dashboard, set the following secrets:

```bash
# Email service credentials (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Admin notification email
ADMIN_EMAIL=admin@dankdealsmn.com

# From email address
FROM_EMAIL=orders@dankdealsmn.com
```

### 4. Set Up Email Processing

#### Option A: Direct Trigger (Recommended for immediate sending)
Modify your order confirmation logic to call the edge function directly:

```typescript
// After confirming order
const { error } = await supabase.functions.invoke('send-order-emails', {
  body: { orderId: order.id }
})
```

#### Option B: Queue Processing (Recommended for reliability)
Set up a cron job to process the email queue:

```bash
# Supabase cron job (every 5 minutes)
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_functions_url') || '/process-email-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
    )
  );
  $$
);
```

## Email Templates

### Customer Email Includes:
- Order number and confirmation
- Detailed order items with strain info
- Delivery address
- Total amount due (cash)
- Next steps (5-minute call, delivery process)
- Contact information

### Admin Email Includes:
- Urgent notification header
- Order timestamp
- Customer contact info (prominently displayed)
- Delivery address with special instructions
- Detailed order items
- Total cash amount due
- Action items checklist

## Testing

### 1. Test Email Function Directly

```bash
# Test with a sample order ID
supabase functions invoke send-order-emails \
  --body '{"orderId":"YOUR_ORDER_ID"}'
```

### 2. Monitor Email Queue

```sql
-- Check pending emails
SELECT * FROM email_queue 
WHERE status = 'pending' 
ORDER BY created_at DESC;

-- Check failed emails
SELECT * FROM email_queue 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

### 3. Manually Process Queue

```bash
# Process pending emails
supabase functions invoke process-email-queue
```

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check RESEND_API_KEY is set correctly
   - Verify email addresses are valid
   - Check email_queue for error messages

2. **Order not found errors**
   - Ensure order has associated profile data
   - Check that order_items are properly linked

3. **Queue processing failures**
   - Check Supabase logs for edge function errors
   - Verify service role key permissions
   - Monitor retry attempts in email_queue

### Debug Queries

```sql
-- Check recent order confirmations
SELECT o.*, p.email, p.first_name, p.last_name
FROM orders o
JOIN profiles p ON o.user_id = p.id
WHERE o.status = 'confirmed'
ORDER BY o.created_at DESC
LIMIT 10;

-- Check email queue status
SELECT 
  eq.*,
  o.order_number,
  p.email
FROM email_queue eq
JOIN orders o ON eq.order_id = o.id
JOIN profiles p ON o.user_id = p.id
ORDER BY eq.created_at DESC;
```

## Security Considerations

1. **API Keys**: Store all API keys as Supabase secrets
2. **RLS Policies**: Email queue is protected by RLS
3. **Service Role**: Only service role can process email queue
4. **Rate Limiting**: Resend API has built-in rate limiting
5. **PII Protection**: Customer data is only sent to registered email

## Monitoring

Set up alerts for:
- Failed email sends (status = 'failed' in email_queue)
- High queue backlog (> 50 pending emails)
- Edge function errors in Supabase logs

## Future Enhancements

1. SMS notifications alongside emails
2. Delivery tracking updates
3. Customer preference management
4. Email template customization
5. Multi-language support 