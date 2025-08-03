# Supabase Edge Functions

## Overview

These are Deno-based edge functions that handle server-side operations for DankDeals.

## Functions

### create-order

Handles order creation with complete product snapshot data.

**Recent Fix**: Added proper TypeScript types and product data capture to prevent email generation failures.

### send-order-emails

Sends order confirmation emails to customers and admins.

### process-email-queue

Processes queued emails asynchronously.

### test-admin-email

Testing function for admin email functionality.

### resend-webhook

Handles webhooks from Resend email service.

## TypeScript Configuration

The functions use a custom `tsconfig.json` that:

- Allows importing `.ts` files directly
- Includes Deno type definitions
- Enables strict type checking

## Type Definitions

Key interfaces used across functions:

```typescript
interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  strain_type?: string;
  thc_content?: number;
  cbd_content?: number;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  name: string;
}
```

## Deployment

Deploy functions using Supabase CLI:

```bash
npx supabase functions deploy <function-name> --no-verify-jwt
```

## Environment Variables

Required environment variables (automatically injected by Supabase):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

Additional secrets to set:

- `RESEND_API_KEY`
- `ADMIN_EMAIL`
- `FROM_EMAIL`
