-- Ensure E-commerce Database Structure
-- This migration ensures all necessary tables, functions, and policies exist for e-commerce functionality

-- Create or ensure profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  age_verified_at TIMESTAMPTZ,
  marketing_consent BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add age_verified column as a regular column (computed columns can't use CURRENT_DATE)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT false;

-- Create or ensure categories table exists
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create or ensure products table exists
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  price DECIMAL(10,2) NOT NULL,
  thc_percentage DECIMAL(5,2),
  cbd_percentage DECIMAL(5,2),
  strain_type TEXT CHECK (strain_type IN ('indica', 'sativa', 'hybrid')),
  effects TEXT[],
  flavors TEXT[],
  image_url TEXT,
  gallery_urls TEXT[],
  stock_quantity INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  weight_grams DECIMAL(8,2),
  lab_tested BOOLEAN DEFAULT false,
  lab_results_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create or ensure addresses table exists
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('billing', 'delivery')) DEFAULT 'delivery',
  label TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  street_address TEXT NOT NULL,
  apartment TEXT,
  unit TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'MN',
  zip_code TEXT NOT NULL,
  phone TEXT,
  delivery_instructions TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create or ensure orders table exists
CREATE TABLE IF NOT EXISTS public.orders (
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
  
  -- Payment Info
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

-- Create or ensure order_items table exists
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- Product snapshot
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

-- Create or ensure cart_items table exists
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, product_id)
);

-- Create or ensure user_preferences table exists
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  marketing_emails BOOLEAN DEFAULT false,
  dark_mode BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create or ensure age_verification_logs table exists
CREATE TABLE IF NOT EXISTS public.age_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  date_of_birth DATE,
  verified BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.age_verification_logs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies to ensure they're correct

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Categories policies
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
CREATE POLICY "Anyone can view active categories" ON public.categories
  FOR SELECT USING (is_active = true);

-- Products policies
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Products viewable by age-verified users" ON public.products;
CREATE POLICY "Products viewable with age verification" ON public.products
  FOR SELECT USING (
    is_active = true AND (
      auth.uid() IS NULL OR 
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND age_verified = true
      )
    )
  );

-- Addresses policies
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;

CREATE POLICY "Users can view their own addresses" ON public.addresses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own addresses" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own addresses" ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own addresses" ON public.addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Orders policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Age-verified users can create orders" ON public.orders;

CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Age-verified users can create orders" ON public.orders
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND age_verified = true
    )
  );
CREATE POLICY "Users can update their pending orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Order items policies
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert their own order items" ON public.order_items;

CREATE POLICY "Users can view their own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert their own order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Cart items policies
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Age-verified users can add to cart" ON public.cart_items;

CREATE POLICY "Users can view their own cart items" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Age-verified users can add to cart" ON public.cart_items
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND age_verified = true
    )
  );
CREATE POLICY "Users can update their own cart items" ON public.cart_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cart items" ON public.cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- User preferences policies
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Age verification logs policies
DROP POLICY IF EXISTS "System inserts verification logs" ON public.age_verification_logs;
DROP POLICY IF EXISTS "Users view own verification logs" ON public.age_verification_logs;

CREATE POLICY "System inserts verification logs" ON public.age_verification_logs
  FOR INSERT WITH CHECK (false);
CREATE POLICY "Users view own verification logs" ON public.age_verification_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Create or replace helper functions

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle new user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Age verification function
CREATE OR REPLACE FUNCTION public.verify_user_age(birth_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
  is_verified BOOLEAN;
BEGIN
  IF birth_date IS NULL THEN
    RETURN false;
  END IF;
  
  is_verified := EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) >= 21;
  
  UPDATE public.profiles
  SET 
    date_of_birth = birth_date,
    age_verified = is_verified,
    age_verified_at = CASE WHEN is_verified THEN NOW() ELSE NULL END
  WHERE id = auth.uid();
  
  RETURN is_verified;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check age verification function
CREATE OR REPLACE FUNCTION public.is_age_verified(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id
    AND age_verified = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clear cart function
CREATE OR REPLACE FUNCTION public.clear_user_cart()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.cart_items WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update order status function
CREATE OR REPLACE FUNCTION public.update_order_status(
  order_id UUID,
  new_status TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.orders
  SET 
    status = new_status,
    updated_at = NOW()
  WHERE id = order_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate order number function
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  order_num TEXT;
  counter INTEGER;
BEGIN
  SELECT TO_CHAR(NOW(), 'YYYYMMDD') INTO order_num;
  
  SELECT COUNT(*) + 1 INTO counter
  FROM public.orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  order_num := order_num || '-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Set order number function
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate order totals function
CREATE OR REPLACE FUNCTION public.calculate_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  item_total DECIMAL(10,2);
  tax_rate DECIMAL(5,4) := 0.0875;
  delivery_fee DECIMAL(10,2) := 5.00;
BEGIN
  SELECT COALESCE(SUM(total_price), 0) INTO item_total
  FROM public.order_items
  WHERE order_id = NEW.order_id;
  
  UPDATE public.orders SET
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

-- Create order from cart function
CREATE OR REPLACE FUNCTION public.create_order_from_cart(
  delivery_address JSONB,
  delivery_date DATE,
  delivery_time_start TIME,
  delivery_time_end TIME,
  delivery_instructions TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_order_id UUID;
  cart_subtotal DECIMAL(10,2);
  tax_rate DECIMAL(5,4) := 0.0875;
  delivery_fee_amount DECIMAL(10,2) := 5.00;
  cart_item RECORD;
BEGIN
  SELECT COALESCE(SUM(ci.quantity * p.price), 0) INTO cart_subtotal
  FROM public.cart_items ci
  JOIN public.products p ON ci.product_id = p.id
  WHERE ci.user_id = auth.uid();
  
  IF cart_subtotal = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;
  
  IF cart_subtotal >= 50 THEN
    delivery_fee_amount := 0;
  END IF;
  
  INSERT INTO public.orders (
    user_id,
    status,
    subtotal,
    tax_amount,
    delivery_fee,
    total_amount,
    delivery_first_name,
    delivery_last_name,
    delivery_street_address,
    delivery_apartment,
    delivery_city,
    delivery_state,
    delivery_zip_code,
    delivery_phone,
    delivery_instructions,
    delivery_date,
    delivery_time_start,
    delivery_time_end,
    payment_method,
    payment_status
  ) VALUES (
    auth.uid(),
    'pending',
    cart_subtotal,
    ROUND(cart_subtotal * tax_rate, 2),
    delivery_fee_amount,
    cart_subtotal + ROUND(cart_subtotal * tax_rate, 2) + delivery_fee_amount,
    delivery_address->>'first_name',
    delivery_address->>'last_name',
    delivery_address->>'street_address',
    delivery_address->>'apartment',
    delivery_address->>'city',
    COALESCE(delivery_address->>'state', 'MN'),
    delivery_address->>'zip_code',
    delivery_address->>'phone',
    delivery_instructions,
    delivery_date,
    delivery_time_start,
    delivery_time_end,
    'cash',
    'pending'
  ) RETURNING id INTO new_order_id;
  
  FOR cart_item IN 
    SELECT ci.*, p.name, p.price, p.weight_grams, p.thc_percentage, 
           p.cbd_percentage, p.strain_type
    FROM public.cart_items ci
    JOIN public.products p ON ci.product_id = p.id
    WHERE ci.user_id = auth.uid()
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      product_price,
      product_weight_grams,
      product_thc_percentage,
      product_cbd_percentage,
      product_strain_type,
      quantity,
      unit_price,
      total_price
    ) VALUES (
      new_order_id,
      cart_item.product_id,
      cart_item.name,
      cart_item.price,
      cart_item.weight_grams,
      cart_item.thc_percentage,
      cart_item.cbd_percentage,
      cart_item.strain_type,
      cart_item.quantity,
      cart_item.price,
      cart_item.quantity * cart_item.price
    );
  END LOOP;
  
  DELETE FROM public.cart_items WHERE user_id = auth.uid();
  
  RETURN new_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user orders function
CREATE OR REPLACE FUNCTION public.get_user_orders(
  limit_count INTEGER DEFAULT 10,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  status TEXT,
  total_amount DECIMAL(10,2),
  delivery_date DATE,
  created_at TIMESTAMPTZ,
  item_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total_amount,
    o.delivery_date,
    o.created_at,
    COUNT(oi.id) as item_count
  FROM public.orders o
  LEFT JOIN public.order_items oi ON o.id = oi.order_id
  WHERE o.user_id = auth.uid()
  GROUP BY o.id
  ORDER BY o.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete profile setup function
CREATE OR REPLACE FUNCTION public.complete_profile_setup(
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  birth_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  is_age_verified BOOLEAN;
BEGIN
  is_age_verified := EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) >= 21;
  
  UPDATE public.profiles
  SET 
    first_name = complete_profile_setup.first_name,
    last_name = complete_profile_setup.last_name,
    phone = complete_profile_setup.phone,
    date_of_birth = birth_date,
    age_verified = is_age_verified,
    age_verified_at = CASE WHEN is_age_verified THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE id = auth.uid();
  
  RETURN is_age_verified;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update age_verified when date_of_birth changes
CREATE OR REPLACE FUNCTION public.update_age_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_of_birth IS NOT NULL THEN
    NEW.age_verified := EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.date_of_birth)) >= 21;
    IF NEW.age_verified AND OLD.age_verified IS DISTINCT FROM NEW.age_verified THEN
      NEW.age_verified_at := NOW();
    END IF;
  ELSE
    NEW.age_verified := false;
    NEW.age_verified_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Log age verification function
CREATE OR REPLACE FUNCTION public.log_age_verification(
  birth_date DATE,
  ip TEXT DEFAULT NULL,
  agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  is_verified BOOLEAN;
BEGIN
  is_verified := EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) >= 21;
  
  INSERT INTO public.age_verification_logs (
    user_id,
    ip_address,
    user_agent,
    date_of_birth,
    verified
  ) VALUES (
    auth.uid(),
    ip::INET,
    agent,
    birth_date,
    is_verified
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_age_verified ON public.profiles;
CREATE TRIGGER update_profiles_age_verified BEFORE INSERT OR UPDATE OF date_of_birth ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_age_verified();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_updated_at ON public.addresses;
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_order_number_trigger ON public.orders;
CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

DROP TRIGGER IF EXISTS recalculate_order_totals_on_insert ON public.order_items;
CREATE TRIGGER recalculate_order_totals_on_insert
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.calculate_order_totals();

DROP TRIGGER IF EXISTS recalculate_order_totals_on_update ON public.order_items;
CREATE TRIGGER recalculate_order_totals_on_update
  AFTER UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.calculate_order_totals();

DROP TRIGGER IF EXISTS recalculate_order_totals_on_delete ON public.order_items;
CREATE TRIGGER recalculate_order_totals_on_delete
  AFTER DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.calculate_order_totals();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_strain_type ON public.products(strain_type);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_type ON public.addresses(type);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON public.addresses(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_age_verified ON public.profiles(age_verified);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Add constraint for default address if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_default_address'
  ) THEN
    ALTER TABLE public.addresses
    ADD CONSTRAINT unique_default_address 
    EXCLUDE (user_id WITH =) WHERE (is_default = true);
  END IF;
END$$;

-- Drop admin-related objects that might exist
DROP TABLE IF EXISTS public.admin_activity_logs CASCADE;
DROP TABLE IF EXISTS public.admin_permissions CASCADE;
DROP TABLE IF EXISTS public.admin_roles CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.admin_sessions CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;

DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.check_admin_permission(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.log_admin_activity(TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_permissions() CASCADE;
DROP FUNCTION IF EXISTS public.create_admin_session(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.validate_admin_session(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.end_admin_session(TEXT) CASCADE;
