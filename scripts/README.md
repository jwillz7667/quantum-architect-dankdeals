# DankDeals Email Scripts

This directory contains scripts for sending order confirmation emails using Resend.

## Setup

1. **Install dependencies:**

   ```bash
   cd scripts
   npm install
   ```

2. **Environment variables required in parent .env:**
   ```
   RESEND_API_KEY=your_resend_api_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Scripts

### send-order-confirmation.js

Sends order confirmation emails for existing orders.

**Usage:**

```bash
# Send confirmation for a specific order
node send-order-confirmation.js ORDER_NUMBER

# Example
node send-order-confirmation.js 20250715-0001
```

**Features:**

- Fetches order details from Supabase
- Creates professional HTML email template
- Includes order items, delivery info, and totals
- Sends via Resend with tracking tags
- Logs email events to database

**Email includes:**

- Order number and customer details
- Itemized order list with weights and prices
- Delivery address and instructions
- Order total breakdown
- Cash on delivery reminders
- Tip suggestions (15%, 18%, 20%)
- Contact information
- Legal compliance notices

## Automated Email Integration

The main app now automatically sends order confirmation emails when orders are created via the `EmailService` class in `/src/lib/emailService.ts`.

**How it works:**

1. Order is placed through checkout
2. Order is created in database
3. Email is queued via `EmailService.queueOrderConfirmationEmail()`
4. Email queue is processed by Supabase Edge Function
5. Customer receives confirmation email
6. Email events are tracked via Resend webhooks

## Email Template Features

- **Professional design** with DankDeals branding
- **Mobile-responsive** HTML layout
- **Cannabis-compliant** legal notices
- **Cash on delivery** payment instructions
- **Tip calculator** with suggested amounts
- **Delivery timeline** and contact info
- **Age verification** reminders

## Testing

To test email sending:

1. Create a test order through the app
2. Check email queue: `SELECT * FROM email_queue WHERE status = 'pending'`
3. Or manually send: `node send-order-confirmation.js ORDER_NUMBER`
4. Monitor webhook events in `email_logs` table

## Troubleshooting

**Email not sending:**

- Check RESEND_API_KEY is valid
- Verify Resend domain is verified
- Check email queue processing function is running

**Template issues:**

- Verify order data exists in database
- Check customer email format
- Review email logs for errors

**Webhook not working:**

- Confirm webhook URL is configured in Resend
- Check webhook function environment variables
- Review webhook logs in Supabase Functions
