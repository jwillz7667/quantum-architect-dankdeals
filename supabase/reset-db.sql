-- Database Reset Script
-- WARNING: This will delete all data! Only use for development.

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS set_order_number() CASCADE;
DROP FUNCTION IF EXISTS calculate_order_totals() CASCADE;

-- Drop existing policies (will be recreated by migrations)
-- Note: Policies are automatically dropped when tables are dropped

-- Clear any existing triggers (will be recreated by migrations)
-- Note: Triggers are automatically dropped when tables are dropped

-- Reset is complete - now run migrations to rebuild database
SELECT 'Database reset complete. Run supabase migration up to rebuild.' AS status; 