# Supabase Security Fixes Guide

## Overview

This document addresses the security warnings identified by Supabase's database linter. These fixes are critical for production security.

## 1. Function Search Path Security (FIXED ✅)

### Issue

17 functions had mutable search paths, which could potentially allow SQL injection attacks.

### Solution Applied

Created migration `20250113_fix_function_search_paths.sql` that sets explicit search paths for all affected functions:

- `update_updated_at_column`
- `verify_user_age`
- `generate_order_number`
- `set_order_number`
- `queue_order_confirmation_email`
- `handle_new_user`
- `check_user_is_admin`
- `is_current_user_admin`
- And 9 other functions (if they exist)

### To Apply

Run the migration in Supabase SQL Editor:

```sql
-- Run the contents of:
supabase/migrations/20250113_fix_function_search_paths.sql
```

## 2. Auth OTP Long Expiry (MANUAL FIX REQUIRED ⚠️)

### Issue

Email OTP expiry is set to more than 1 hour, which reduces security.

### Solution

1. Go to Supabase Dashboard → Authentication → Providers
2. Click on Email provider settings
3. Find "OTP Expiry" setting
4. Change from current value to **3600 seconds (1 hour)** or less
5. Recommended: **1800 seconds (30 minutes)**
6. Save changes

## 3. Leaked Password Protection (MANUAL FIX REQUIRED ⚠️)

### Issue

Leaked password protection is disabled, allowing users to use compromised passwords.

### Solution

1. Go to Supabase Dashboard → Authentication → Settings
2. Find "Security" section
3. Enable **"Leaked Password Protection"**
4. This will check passwords against HaveIBeenPwned database
5. Save changes

## Security Best Practices Implemented

### 1. Fixed Search Paths

All functions now have explicit search paths that include only necessary schemas:

- `public` - for application tables
- `auth` - for authentication functions that need it
- `pg_catalog` - for PostgreSQL system functions

### 2. Why This Matters

- **Prevents SQL Injection**: Fixed search paths prevent attackers from hijacking function behavior
- **Consistent Behavior**: Functions always use the expected schemas
- **Security Compliance**: Meets database security best practices

## Verification

After applying all fixes, you can verify by:

1. **Re-run the linter** in Supabase Dashboard → Database → Linter
2. **Check function search paths**:

```sql
SELECT
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  p.prosecdef AS security_definer,
  p.proconfig AS configuration
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proconfig IS NOT NULL
  AND array_to_string(p.proconfig, ',') LIKE '%search_path%';
```

## Additional Recommendations

1. **Regular Security Audits**: Run the Supabase linter regularly
2. **Monitor Auth Settings**: Review authentication settings quarterly
3. **Update Dependencies**: Keep Supabase client libraries updated
4. **Enable 2FA**: For all admin accounts
5. **Review RLS Policies**: Ensure all tables have appropriate Row Level Security

## Status Summary

| Issue                      | Status               | Action Required     |
| -------------------------- | -------------------- | ------------------- |
| Function Search Paths      | ✅ Migration Created | Run migration       |
| OTP Expiry                 | ⚠️ Manual Fix Needed | Update in Dashboard |
| Leaked Password Protection | ⚠️ Manual Fix Needed | Enable in Dashboard |
