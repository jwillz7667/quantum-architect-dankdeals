# Deploy Resend Webhook Function

## Steps to deploy the webhook function:

1. **Start Docker Desktop** (required for Supabase functions)

2. **Deploy the function:**

   ```bash
   npx supabase functions deploy resend-webhook --no-verify-jwt
   ```

3. **Set environment variables in Supabase dashboard:**
   - Go to Project Settings > Functions
   - Add these environment variables:
     - `RESEND_WEBHOOK_SECRET`: Your webhook secret from Resend
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

4. **Deploy database migration:**
   ```bash
   npx supabase db push
   ```

## Webhook URL

After deployment, your webhook URL will be:

```
https://ralbzuvkyexortqngvxs.supabase.co/functions/v1/resend-webhook
```

## Configure in Resend Dashboard

1. Go to [Resend Dashboard > Webhooks](https://resend.com/webhooks)
2. Click "Add Webhook"
3. Set URL to your webhook endpoint above
4. Select events to monitor:
   - `email.sent`
   - `email.delivered`
   - `email.delivery_delayed`
   - `email.bounced`
   - `email.complained`
   - `email.opened`
   - `email.clicked`
5. Generate webhook secret and add to environment variables
6. Save webhook

## Testing

After setup, you can test by:

1. Sending a test email through your app
2. Check the webhook logs in Supabase Functions
3. Verify events are logged in the `email_logs` table
