-- Query to check if admin functions exist in database

-- Check for admin_upsert_product function
SELECT
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'admin_upsert_product';

-- Check for admin_delete_product function
SELECT
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'admin_delete_product';

-- Check for ensure_admin_access function
SELECT
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'ensure_admin_access';

-- List all admin-related functions
SELECT
  proname as function_name,
  pronargs as num_args,
  proargtypes::regtype[] as arg_types
FROM pg_proc
WHERE proname LIKE 'admin%'
ORDER BY proname;
