-- Fix for OnePageCheckout component
-- Add missing columns safely

DO $$ 
BEGIN
  -- Add customer_phone_number if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'customer_phone_number'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN customer_phone_number TEXT;
  END IF;

  -- Add delivery_instructions if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'delivery_instructions'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN delivery_instructions TEXT;
  END IF;

  -- Add payment_method if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_method TEXT DEFAULT 'cash';
  END IF;

  -- Add payment_status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Update RLS policies for orders
DROP POLICY IF EXISTS "Allow guest and authenticated user orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Allow viewing orders by user or order number" ON orders;

-- Simple policy: Anyone can create orders
CREATE POLICY "public_order_insert" ON orders
  FOR INSERT 
  WITH CHECK (true);

-- Simple policy: View own orders or guest orders
CREATE POLICY "public_order_select" ON orders
  FOR SELECT 
  USING (
    (auth.uid() = user_id) OR (user_id IS NULL)
  );

-- Update order_items policies
DROP POLICY IF EXISTS "Allow order items for guest and authenticated orders" ON order_items;
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
DROP POLICY IF EXISTS "Allow viewing order items for orders" ON order_items;
DROP POLICY IF EXISTS "Users can view order items for their orders" ON order_items;

-- Simple policy: Anyone can create order items
CREATE POLICY "public_order_items_insert" ON order_items
  FOR INSERT 
  WITH CHECK (true);

-- Simple policy: View order items for accessible orders
CREATE POLICY "public_order_items_select" ON order_items
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id
    )
  );