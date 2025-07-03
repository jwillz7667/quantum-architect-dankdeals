-- supabase/migrations/20250703000000-cleanup.sql
-- Run this FIRST if you have errors about columns not existing

-- This cleanup script removes any existing tables that might have wrong schemas
-- from previous migration attempts or manual creation

-- Drop tables from the store settings migration if they exist
DROP TABLE IF EXISTS public.report_history CASCADE;
DROP TABLE IF EXISTS public.scheduled_reports CASCADE;
DROP TABLE IF EXISTS public.security_settings CASCADE;
DROP TABLE IF EXISTS public.notification_settings CASCADE;
DROP TABLE IF EXISTS public.delivery_zones CASCADE;
DROP TABLE IF EXISTS public.store_settings CASCADE;

-- Drop tables from admin dashboard migration if they exist
DROP TABLE IF EXISTS public.admin_activity_logs CASCADE;
DROP TABLE IF EXISTS public.user_metrics CASCADE;
DROP TABLE IF EXISTS public.product_metrics CASCADE;

-- Drop tables from notifications migration if they exist  
DROP TABLE IF EXISTS public.admin_notifications CASCADE;

-- Remove any functions that might conflict
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.get_dashboard_stats(date, date) CASCADE;
DROP FUNCTION IF EXISTS public.get_product_performance(date, date) CASCADE;
DROP FUNCTION IF EXISTS public.log_admin_action() CASCADE;
DROP FUNCTION IF EXISTS public.create_admin_notification(text, text, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.notify_admin(uuid, text, text, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.notify_admins_new_order() CASCADE;
DROP FUNCTION IF EXISTS public.notify_admins_low_inventory() CASCADE;
DROP FUNCTION IF EXISTS public.notify_admins_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.auto_assign_admin_role() CASCADE;

-- Remove any triggers that might exist
DROP TRIGGER IF EXISTS assign_admin_role_on_signup ON auth.users;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Cleanup completed successfully. You can now run the migrations in order.';
END $$; 