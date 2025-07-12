# Supabase Edge Functions

This directory contains Supabase Edge Functions that run on Deno runtime.

## TypeScript Configuration

These functions use Deno runtime, not Node.js. If you're seeing TypeScript errors in VS Code:

1. **Install Deno extension** for VS Code (if you want proper Deno support)
2. The functions include `@ts-ignore` comments for Deno-specific imports
3. TypeScript configuration is separate from the main project

## Available Functions

### send-order-emails
Sends order confirmation emails to customers and admin notifications.

### process-email-queue
Processes queued emails with retry logic for reliability.

## Deployment

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy send-order-emails
```

## Environment Variables

Set these in your Supabase dashboard:

- `RESEND_API_KEY`: Your Resend API key for sending emails
- `ADMIN_EMAIL`: Email address for admin notifications
- `FROM_EMAIL`: Sender email address

## Testing

```bash
# Test locally
supabase functions serve send-order-emails

# Invoke remotely
supabase functions invoke send-order-emails --body '{"orderId":"YOUR_ORDER_ID"}'
``` 