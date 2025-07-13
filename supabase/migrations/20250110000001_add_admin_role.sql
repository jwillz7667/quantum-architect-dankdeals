-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create an index for better performance when querying admins
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- Update RLS policies to allow admins to access all data
-- Products policy for admins
CREATE POLICY "Admins can do everything with products" ON products
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

-- Orders policy for admins  
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

-- Profiles policy for admins
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

-- Grant admin role to specific email (update this with your admin email)
UPDATE profiles SET is_admin = true WHERE email = 'admin@dankdealsmn.com'; 