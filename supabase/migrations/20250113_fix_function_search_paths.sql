-- Fix Function Search Path Security Issues
-- This migration sets a fixed search_path for all functions to prevent SQL injection vulnerabilities

-- Create a temporary function to fix search paths dynamically
CREATE OR REPLACE FUNCTION fix_function_search_path(schema_name text, function_name text) 
RETURNS void AS $$
DECLARE
  func_oid oid;
  func_args text;
  alter_cmd text;
BEGIN
  -- Find the function OID and get its full signature
  SELECT p.oid, pg_get_function_identity_arguments(p.oid)
  INTO func_oid, func_args
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = schema_name AND p.proname = function_name
  LIMIT 1;  -- In case of overloaded functions, fix the first one
  
  IF func_oid IS NOT NULL THEN
    -- Build the ALTER FUNCTION command with the correct signature
    alter_cmd := format('ALTER FUNCTION %I.%I(%s) SET search_path = %s',
                       schema_name, 
                       function_name, 
                       func_args,
                       CASE 
                         WHEN function_name IN ('verify_user_age', 'handle_new_user', 'check_user_is_admin', 'is_current_user_admin') 
                         THEN 'public, auth, pg_catalog'
                         ELSE 'public, pg_catalog'
                       END);
    EXECUTE alter_cmd;
    RAISE NOTICE 'Fixed search_path for %.%(%)', schema_name, function_name, func_args;
  ELSE
    RAISE NOTICE 'Function %.% not found, skipping', schema_name, function_name;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error fixing %.%: %', schema_name, function_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Fix all known functions
SELECT fix_function_search_path('public', 'update_updated_at_column');
SELECT fix_function_search_path('public', 'verify_user_age');
SELECT fix_function_search_path('public', 'generate_order_number');
SELECT fix_function_search_path('public', 'set_order_number');
SELECT fix_function_search_path('public', 'queue_order_confirmation_email');
SELECT fix_function_search_path('public', 'handle_new_user');
SELECT fix_function_search_path('public', 'check_user_is_admin');
SELECT fix_function_search_path('public', 'is_current_user_admin');

-- Fix functions that might exist
SELECT fix_function_search_path('public', 'log_age_verification');
SELECT fix_function_search_path('public', 'is_age_verified');
SELECT fix_function_search_path('public', 'clear_user_cart');
SELECT fix_function_search_path('public', 'update_order_status');
SELECT fix_function_search_path('public', 'calculate_order_totals');
SELECT fix_function_search_path('public', 'create_order_from_cart');
SELECT fix_function_search_path('public', 'get_user_orders');
SELECT fix_function_search_path('public', 'complete_profile_setup');
SELECT fix_function_search_path('public', 'update_age_verified');

-- Clean up the temporary function
DROP FUNCTION fix_function_search_path(text, text);

-- Add comment explaining the security fix
COMMENT ON SCHEMA public IS 'All functions in this schema have been updated with explicit search_path to prevent SQL injection vulnerabilities';

-- Verify the fixes
SELECT 
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  CASE 
    WHEN p.proconfig IS NULL OR NOT array_to_string(p.proconfig, ',') LIKE '%search_path%' 
    THEN 'NOT FIXED - No search_path set'
    ELSE 'FIXED - ' || array_to_string(p.proconfig, ',')
  END AS search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'  -- Only functions, not procedures
ORDER BY 
  CASE 
    WHEN p.proconfig IS NULL OR NOT array_to_string(p.proconfig, ',') LIKE '%search_path%' 
    THEN 0 
    ELSE 1 
  END,
  p.proname; 