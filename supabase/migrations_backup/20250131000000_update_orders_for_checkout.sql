-- Update orders table to support the new checkout flow
-- Add missing columns for customer information

-- Add customer phone number if it doesn't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_phone_number TEXT;

-- Add delivery instructions if it doesn't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_instructions TEXT;

-- Add payment method if it doesn't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash' 
  CHECK (payment_method IN ('cash', 'card', 'crypto'));

-- Add payment status if it doesn't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- Add notes column for internal use
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create an index on order_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Create an index on user_id for faster user order queries
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Create an index on status for admin queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Update RLS policies to be more permissive for guest checkout
DROP POLICY IF EXISTS "Allow guest and authenticated user orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Allow viewing orders by user or order number" ON orders;

-- Policy for inserting orders (both guest and authenticated)
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT 
  WITH CHECK (true);

-- Policy for viewing orders
CREATE POLICY "Users can view their orders" ON orders
  FOR SELECT 
  USING (
    -- Authenticated users can see their own orders
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Anyone can view guest orders (for order confirmation)
    user_id IS NULL
  );

-- Policy for updating orders (only service role)
CREATE POLICY "Only service role can update orders" ON orders
  FOR UPDATE 
  USING (false);

-- Update order_items policies
DROP POLICY IF EXISTS "Allow order items for guest and authenticated orders" ON order_items;
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
DROP POLICY IF EXISTS "Allow viewing order items for orders" ON order_items;
DROP POLICY IF EXISTS "Users can view order items for their orders" ON order_items;

-- Policy for inserting order items
CREATE POLICY "Anyone can create order items for their orders" ON order_items
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id
    )
  );

-- Policy for viewing order items
CREATE POLICY "Users can view order items" ON order_items
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (
        -- User's own order
        (auth.uid() IS NOT NULL AND orders.user_id = auth.uid())
        OR
        -- Guest order
        orders.user_id IS NULL
      )
    )
  );

-- Create a function to calculate order totals
CREATE OR REPLACE FUNCTION calculate_order_total(order_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  items_subtotal DECIMAL;
  tax_rate DECIMAL := 0.0875; -- Minnesota tax rate
  delivery_fee DECIMAL := 5.00;
BEGIN
  -- Calculate items subtotal
  SELECT COALESCE(SUM(quantity * unit_price), 0)
  INTO items_subtotal
  FROM order_items
  WHERE order_items.order_id = calculate_order_total.order_id;
  
  -- Update order with calculated values
  UPDATE orders
  SET 
    subtotal = items_subtotal,
    tax_amount = items_subtotal * tax_rate,
    delivery_fee = delivery_fee,
    total_amount = items_subtotal + (items_subtotal * tax_rate) + delivery_fee
  WHERE id = calculate_order_total.order_id;
  
  RETURN items_subtotal + (items_subtotal * tax_rate) + delivery_fee;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update order totals when items change
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_order_total(NEW.order_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_order_totals_trigger ON order_items;

-- Create trigger for order items
CREATE TRIGGER update_order_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_totals();

-- Add comments
COMMENT ON COLUMN public.orders.customer_phone_number IS 'Customer phone number for delivery coordination';
COMMENT ON COLUMN public.orders.delivery_instructions IS 'Special delivery instructions from customer';
COMMENT ON COLUMN public.orders.payment_method IS 'Payment method: cash, card, or crypto';
COMMENT ON COLUMN public.orders.payment_status IS 'Payment status: pending, paid, failed, or refunded';
COMMENT ON FUNCTION calculate_order_total IS 'Calculates and updates order totals based on items';
COMMENT ON FUNCTION update_order_totals IS 'Trigger function to automatically update order totals';