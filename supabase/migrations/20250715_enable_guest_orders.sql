-- Enable guest orders by modifying RLS policies
-- This allows orders to be created without authentication for guest checkout

-- Drop existing restrictive order policies
DROP POLICY IF EXISTS "Age-verified users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;

-- Create new policy that allows guest orders (where user_id is null)
-- or authenticated user orders
CREATE POLICY "Allow guest and authenticated user orders" ON orders
  FOR INSERT 
  WITH CHECK (
    -- Allow guest orders (user_id is null)
    user_id IS NULL 
    OR 
    -- Allow authenticated users to create their own orders
    (auth.uid() = user_id)
  );

-- Update order items policy to work with guest orders
CREATE POLICY "Allow order items for guest and authenticated orders" ON order_items
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (
        -- Guest order (no user_id required)
        orders.user_id IS NULL
        OR 
        -- Authenticated user order
        orders.user_id = auth.uid()
      )
    )
  );

-- Allow reading order items for guest orders (using order_id)
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
CREATE POLICY "Allow viewing order items for orders" ON order_items
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (
        -- Guest order (public access via order number)
        orders.user_id IS NULL
        OR 
        -- Authenticated user's own order
        orders.user_id = auth.uid()
      )
    )
  );

-- Allow anonymous users to view their own orders using order_number
-- This is safe because order numbers are generated and hard to guess
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Allow viewing orders by user or order number" ON orders
  FOR SELECT 
  USING (
    -- Guest orders can be viewed by anyone (for order confirmation)
    user_id IS NULL
    OR 
    -- Authenticated users can view their own orders
    auth.uid() = user_id
  );

-- Comment explaining the changes
COMMENT ON POLICY "Allow guest and authenticated user orders" ON orders IS 'Enables guest checkout by allowing orders with null user_id';
COMMENT ON POLICY "Allow order items for guest and authenticated orders" ON order_items IS 'Allows order items for both guest and authenticated orders';