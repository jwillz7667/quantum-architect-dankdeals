# Checkout Edge Functions Debug Guide

## Issues Identified

### 1. **Database Schema Mismatch**

The `send-order-emails` function expects columns in `order_items` that may not exist or be populated:

- `product_name`
- `product_strain_type`
- `product_thc_percentage`
- `product_cbd_percentage`
- `product_weight_grams`
- `total_price`

**Solution**: The fixed `create-order` function now fetches product details and stores snapshot data.

### 2. **Missing Product Snapshot Data**

Original `create-order` only stored:

- `product_id`
- `quantity`
- `unit_price`

**Solution**: Now stores complete product information at time of order.

### 3. **Error Handling Issues**

- No proper rollback on partial failures
- Email errors could fail silently
- Missing validation for required fields

**Solution**: Added transaction-like behavior and better error handling.

## Deployment Steps

1. **Run Database Migration**

   ```sql
   -- Run in Supabase SQL Editor
   -- File: supabase/migrations/20250804000000_ensure_order_items_columns.sql
   ```

2. **Deploy Fixed Edge Functions**

   ```bash
   ./scripts/fix-checkout-functions.sh
   ```

3. **Test Checkout Flow**
   - Place a test order
   - Verify order creation
   - Check email delivery
   - Monitor logs

## Monitoring Commands

```bash
# View edge function logs
npx supabase functions logs create-order --tail
npx supabase functions logs send-order-emails --tail

# Check function status
npx supabase functions list
```

## Rollback Procedure

If issues persist:

```bash
./scripts/rollback-checkout-functions.sh
```

## Common Error Messages

### "Failed to create order. Please try again."

- Check database connection
- Verify RLS policies
- Check column existence

### "Email service not configured"

- Verify RESEND_API_KEY secret
- Check Resend account status

### "Order not found"

- Verify order was created successfully
- Check order_number format

## Testing Checklist

- [ ] Database migration applied
- [ ] Edge functions deployed
- [ ] Test order with logged-in user
- [ ] Test guest checkout
- [ ] Verify customer email received
- [ ] Verify admin email received
- [ ] Check order appears in database
- [ ] Verify all product data captured

## Production Debugging

1. **Check Supabase Dashboard**
   - Edge Functions → Logs
   - Database → Tables → orders/order_items
   - Authentication → Users (for auth issues)

2. **Verify Environment Variables**
   - RESEND_API_KEY
   - ADMIN_EMAIL
   - FROM_EMAIL

3. **Database Queries**

   ```sql
   -- Check recent orders
   SELECT * FROM orders
   ORDER BY created_at DESC
   LIMIT 10;

   -- Check order items with product data
   SELECT oi.*, p.name as current_product_name
   FROM order_items oi
   LEFT JOIN products p ON oi.product_id = p.id
   WHERE oi.order_id = 'YOUR_ORDER_ID';

   -- Check for missing columns
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'order_items'
   AND table_schema = 'public';
   ```

## Quick Fixes

### If orders create but emails fail:

1. Check RESEND_API_KEY is set correctly
2. Verify email addresses are valid
3. Check Resend dashboard for failures
4. Look for rate limiting (2 req/sec limit)

### If orders fail to create:

1. Check all required columns exist
2. Verify phone number format
3. Check for RLS policy issues
4. Ensure product IDs are valid

### If product data is missing:

1. Run the migration to add columns
2. Deploy the fixed create-order function
3. Verify products table has required data
