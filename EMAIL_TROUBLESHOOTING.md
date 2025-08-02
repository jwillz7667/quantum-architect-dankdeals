# Email Troubleshooting Guide for DankDeals

## Issue: Emails Not Sending During Checkout

### Root Causes Identified

1. **Missing Database Fields**: The `create-order` function was not storing `customer_email` in the database
2. **Environment Variables**: Edge functions require proper environment variables in Supabase dashboard
3. **Edge Function Invocation**: Emails are sent via the `send-order-emails` edge function after order creation

### Fixes Applied

1. **Updated create-order function** (✅ COMPLETED)
   - Now properly stores `customer_email` and `customer_phone_number` in the database
   - Previously only stored in the `notes` field

### Required Actions

1. **Set Environment Variables in Supabase Dashboard**

   Navigate to your Supabase project dashboard → Edge Functions → Settings and add:

   ```
   RESEND_API_KEY=re_hj9uKYys_G2cEExGjRdiFnUZV6HEN6qFP
   ADMIN_EMAIL=admin@dankdealsmn.com
   FROM_EMAIL=orders@dankdealsmn.com
   ```

2. **Deploy Updated Edge Functions**

   ```bash
   # Deploy the updated create-order function
   supabase functions deploy create-order

   # Deploy the send-order-emails function
   supabase functions deploy send-order-emails
   ```

3. **Verify Database Migrations**

   Ensure the following migrations have been run:
   - `20250130000000_add_customer_email_to_orders.sql`
   - `20250131000000_update_orders_for_checkout.sql`
   - `20250801000000_fix_missing_order_columns.sql`

### How Email Sending Works

1. **Order Creation Flow**:
   - Customer submits checkout form
   - `create-order` edge function creates order in database with `customer_email`
   - Frontend calls `send-order-emails` edge function with the order ID
2. **Email Sending Process**:
   - `send-order-emails` function fetches order details from database
   - Sends two emails via Resend API:
     - Customer confirmation email (if valid email exists)
     - Admin notification email (always sent)
   - Uses rate limiting (600ms delay between emails)

3. **Email Content**:
   - Customer receives order confirmation with details and next steps
   - Admin receives urgent notification with customer contact info

### Testing Email Functionality

1. **Test Edge Function Directly**:

   ```bash
   # Replace ORDER_ID with an actual order ID from your database
   supabase functions invoke send-order-emails --body '{"orderId":"ORDER_ID"}'
   ```

2. **Check Edge Function Logs**:

   ```bash
   supabase functions logs send-order-emails
   ```

3. **Verify Email Service**:
   - Check Resend dashboard for sent emails: https://resend.com/emails
   - Verify API key is active and has sufficient credits

### Common Issues and Solutions

1. **"Email service not configured" Error**
   - Solution: Add `RESEND_API_KEY` to Supabase edge function environment variables

2. **"Order not found" Error**
   - Ensure order ID exists in database
   - Check if using UUID format vs order number

3. **Email Not Received but No Error**
   - Check if customer_email is 'guest@example.com' (skipped)
   - Verify email address is valid
   - Check spam folder
   - Verify Resend API key has sending permissions

4. **Rate Limiting Issues**
   - The function includes 600ms delay between emails
   - Resend allows 2 requests per second on free tier

### Email Fallback Mechanism

The system includes a fallback email queue mechanism:

- If edge function fails, emails can be queued in `email_queue` table
- Process queued emails with `process-email-queue` edge function

### Monitoring Recommendations

1. **Set up alerts** for failed edge function invocations
2. **Monitor Resend dashboard** for bounce rates and delivery issues
3. **Check edge function logs** regularly for errors
4. **Test order flow** after each deployment

### Contact for Issues

If emails still aren't sending after following this guide:

1. Check Supabase edge function logs
2. Verify Resend API status
3. Review order data in database for missing fields
