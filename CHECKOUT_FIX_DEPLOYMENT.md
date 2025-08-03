# Checkout Fix Deployment Guide

## Overview

This guide will help you deploy the fixes for the checkout edge function errors.

## Step 1: Apply Database Migration

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Create a new query
5. Copy and paste the contents of `supabase/migrations/20250804000000_ensure_order_items_columns.sql`
6. Click **Run**

### Option B: Via Supabase CLI

```bash
# If you haven't already, link your project
npx supabase link --project-ref ralbzuvkyexortqngvxs

# Push all migrations
npx supabase db push --include-all
```

## Step 2: Deploy Fixed Edge Functions

### Deploy the updated create-order function:

```bash
# Copy the fixed version
cp supabase/functions/create-order/index-fixed.ts supabase/functions/create-order/index.ts

# Deploy to Supabase
npx supabase functions deploy create-order --no-verify-jwt
```

### Verify deployment:

```bash
# Check function status
npx supabase functions list

# Monitor logs
npx supabase functions logs create-order --tail
```

## Step 3: Test the Fix

### Test Order Creation:

1. Go to your website
2. Add items to cart
3. Complete checkout
4. Verify:
   - Order creates successfully
   - Customer receives email
   - Admin receives email
   - No 500 errors

### Check Database:

```sql
-- Run in SQL Editor to verify recent orders
SELECT
  o.order_number,
  o.created_at,
  o.customer_email,
  o.total_amount,
  COUNT(oi.id) as item_count,
  bool_and(oi.product_name IS NOT NULL) as has_product_names
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.created_at > NOW() - INTERVAL '1 day'
GROUP BY o.id, o.order_number, o.created_at, o.customer_email, o.total_amount
ORDER BY o.created_at DESC
LIMIT 10;
```

## Step 4: Monitor for Issues

### Watch Edge Function Logs:

```bash
# In one terminal
npx supabase functions logs create-order --tail

# In another terminal
npx supabase functions logs send-order-emails --tail
```

### Common Issues and Solutions:

#### "Failed to create order"

- Check if all columns exist in order_items table
- Verify migration was applied successfully
- Check for RLS policy issues

#### "Email not sent"

- Verify RESEND_API_KEY is set in environment variables
- Check Resend dashboard for API errors
- Ensure email addresses are valid

#### "Product data missing"

- Ensure products table has all required fields
- Verify product IDs are valid
- Check if migration populated existing orders

## Rollback Plan

If issues persist after deployment:

1. **Restore Original Function:**

   ```bash
   ./scripts/rollback-checkout-functions.sh
   ```

2. **Monitor Original Behavior:**
   - Check if original errors return
   - Document any new errors

3. **Contact Support:**
   - Include error logs
   - Provide order IDs that failed
   - Share migration status

## Success Verification

✅ Orders create without errors
✅ All order_items have product snapshot data
✅ Emails send successfully
✅ No 500 errors in checkout flow
✅ Admin can view complete order details

## Next Steps

Once verified:

1. Remove backup files
2. Update documentation
3. Monitor for 24 hours
4. Consider adding automated tests
