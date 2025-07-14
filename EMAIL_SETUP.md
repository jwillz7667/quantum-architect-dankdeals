# Email Notification Setup Guide

This guide explains how to set up the complete email notification system for order confirmations and admin alerts.

## Overview

The email system consists of:

1. **Database triggers** that queue emails when orders are created
2. **Supabase Edge Functions** that process and send emails
3. **Resend API** for reliable email delivery
4. **Customer confirmation emails** with order details
5. **Admin alert emails** for immediate order notifications

## 1. Database Setup

The database already includes:

- `email_queue` table for queuing emails
- `orders` table with proper triggers
- Database triggers that automatically queue emails when orders are confirmed

## 2. Supabase Edge Functions

Two Edge Functions are included:

### A. `send-order-emails` Function

- Formats and sends both customer confirmation and admin alert emails
- Uses Resend API for delivery
- Includes detailed order information and HTML templates

### B. `process-email-queue` Function

- Processes pending emails from the queue
- Handles retries and error logging
- Should be called periodically (recommended: every 5 minutes)

## 3. Required Environment Variables

Set these variables in your Supabase Edge Functions environment:

```bash
# Email Service Configuration
RESEND_API_KEY=re_your_resend_api_key_here
ADMIN_EMAIL=admin@dankdealsmn.com
FROM_EMAIL=orders@dankdealsmn.com

# Supabase Configuration (automatically available)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 4. Resend API Setup

1. **Sign up for Resend**: Go to [resend.com](https://resend.com) and create an account

2. **Get API Key**:
   - Navigate to API Keys section
   - Create a new API key
   - Copy the key (starts with `re_`)

3. **Domain Setup**:
   - Add your domain (e.g., `dankdealsmn.com`)
   - Verify domain ownership via DNS
   - Wait for domain verification to complete

4. **Set Environment Variables**:
   ```bash
   # In Supabase Dashboard > Edge Functions > Settings
   RESEND_API_KEY=re_your_actual_api_key
   ADMIN_EMAIL=admin@dankdealsmn.com
   FROM_EMAIL=orders@dankdealsmn.com
   ```

## 5. Email Templates

The system includes two email templates:

### Customer Confirmation Email

- Professional HTML template with DankDeals branding
- Order details with item breakdown
- Delivery address confirmation
- Next steps and contact information
- Legal disclaimers for cannabis delivery

### Admin Alert Email

- Urgent styling for immediate attention
- Customer contact information prominently displayed
- Complete order details for processing
- Action items checklist
- Cash payment reminder

## 6. Deployment Steps

1. **Deploy Edge Functions**:

   ```bash
   # Deploy both functions
   supabase functions deploy send-order-emails
   supabase functions deploy process-email-queue
   ```

2. **Set Environment Variables**:

   ```bash
   # Set the required environment variables
   supabase secrets set RESEND_API_KEY=re_your_key
   supabase secrets set ADMIN_EMAIL=admin@dankdealsmn.com
   supabase secrets set FROM_EMAIL=orders@dankdealsmn.com
   ```

3. **Test the System**:
   - Place a test order through the application
   - Check the `email_queue` table for pending emails
   - Manually invoke the `process-email-queue` function
   - Verify both customer and admin emails are received

## 7. Production Monitoring

### Automated Processing

Set up a cron job or scheduled task to process the email queue:

```bash
# Example: Every 5 minutes
*/5 * * * * curl -X POST https://your-project.supabase.co/functions/v1/process-email-queue -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Email Queue Monitoring

Monitor the `email_queue` table for:

- Failed emails (`status = 'failed'`)
- High retry counts (`attempts > 2`)
- Old pending emails (`created_at < NOW() - INTERVAL '1 hour'`)

### Logging

The system logs all email activities:

- Order creation events
- Email sending attempts
- Error messages and retry attempts
- Performance metrics

## 8. Email Content Customization

### Customer Email Features:

- Order confirmation with professional branding
- Detailed order breakdown with prices
- Delivery address confirmation
- Payment method reminder (Cash on Delivery)
- Next steps with timeline
- Contact information and support details

### Admin Email Features:

- Urgent alert styling (red header)
- Customer contact information highlighted
- Complete order details for fulfillment
- Action items checklist
- Cash payment total prominently displayed
- Delivery address with special instructions

## 9. Security Best Practices

1. **API Keys**: Store all API keys as environment variables, never in code
2. **Email Validation**: Customer emails are validated before sending
3. **Rate Limiting**: Resend API has built-in rate limiting
4. **Error Handling**: Comprehensive error handling with retry logic
5. **Data Sanitization**: Sensitive data is filtered from logs

## 10. Testing

### Test Customer Email:

```bash
# Test customer confirmation email
curl -X POST https://your-project.supabase.co/functions/v1/send-order-emails \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "your-test-order-id"}'
```

### Test Email Queue Processing:

```bash
# Test queue processing
curl -X POST https://your-project.supabase.co/functions/v1/process-email-queue \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## 11. Troubleshooting

### Common Issues:

1. **Emails not sending**: Check Resend API key and domain verification
2. **Queue not processing**: Verify `process-email-queue` function is deployed
3. **Missing emails**: Check `email_queue` table for failed entries
4. **Template issues**: Validate HTML in email templates

### Debug Steps:

1. Check Supabase Edge Function logs
2. Verify environment variables are set
3. Test Resend API key independently
4. Review email queue table for error messages

## 12. Compliance Notes

- All emails include cannabis compliance disclaimers
- Age verification reminders (21+)
- Clear unsubscribe instructions (when applicable)
- Privacy policy and terms of service links
- Minnesota cannabis regulations compliance

The email system is now fully integrated with the order placement flow and will automatically send notifications when customers place orders.
