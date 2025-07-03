-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled')) DEFAULT 'pending',
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Delivery Address (denormalized for order history)
  delivery_first_name TEXT NOT NULL,
  delivery_last_name TEXT NOT NULL,
  delivery_street_address TEXT NOT NULL,
  delivery_apartment TEXT,
  delivery_city TEXT NOT NULL,
  delivery_state TEXT NOT NULL DEFAULT 'MN',
  delivery_zip_code TEXT NOT NULL,
  delivery_phone TEXT,
  delivery_instructions TEXT,
  
  -- Payment Info (minimal for compliance)
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'other')) DEFAULT 'cash',
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  
  -- Delivery Window
  delivery_date DATE,
  delivery_time_start TIME,
  delivery_time_end TIME,
  
  -- Order Tracking
  estimated_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- Product snapshot (for order history)
  product_name TEXT NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  product_weight_grams DECIMAL(8,2),
  product_thc_percentage DECIMAL(5,2),
  product_cbd_percentage DECIMAL(5,2),
  product_strain_type TEXT,
  
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cart_items table (for persistent cart)
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure user can only have one cart item per product
  UNIQUE(user_id, product_id)
);

-- Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for order_items
CREATE POLICY "Users can view their own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- RLS Policies for cart_items
CREATE POLICY "Users can view their own cart items" ON cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items" ON cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items" ON cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items" ON cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  order_num TEXT;
  counter INTEGER;
BEGIN
  -- Get current date in YYYYMMDD format
  SELECT TO_CHAR(NOW(), 'YYYYMMDD') INTO order_num;
  
  -- Get count of orders today + 1
  SELECT COUNT(*) + 1 INTO counter
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Format as YYYYMMDD-0001
  order_num := order_num || '-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Function to set order number before insert
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set order number
CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Add updated_at triggers
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate order totals
CREATE OR REPLACE FUNCTION calculate_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  item_total DECIMAL(10,2);
  tax_rate DECIMAL(5,4) := 0.0875; -- 8.75% Minnesota cannabis tax
  delivery_fee DECIMAL(10,2) := 5.00;
BEGIN
  -- Calculate subtotal from order items
  SELECT COALESCE(SUM(total_price), 0) INTO item_total
  FROM order_items
  WHERE order_id = NEW.order_id;
  
  -- Update order totals
  UPDATE orders SET
    subtotal = item_total,
    tax_amount = ROUND(item_total * tax_rate, 2),
    delivery_fee = CASE 
      WHEN item_total >= 50 THEN 0 
      ELSE delivery_fee 
    END,
    total_amount = item_total + ROUND(item_total * tax_rate, 2) + 
                   CASE WHEN item_total >= 50 THEN 0 ELSE delivery_fee END,
    updated_at = NOW()
  WHERE id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate totals when order items change
CREATE TRIGGER recalculate_order_totals_on_insert
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION calculate_order_totals();

CREATE TRIGGER recalculate_order_totals_on_update
  AFTER UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION calculate_order_totals();

CREATE TRIGGER recalculate_order_totals_on_delete
  AFTER DELETE ON order_items
  FOR EACH ROW EXECUTE FUNCTION calculate_order_totals(); 