-- Clean Database Setup - Drop existing tables and recreate
-- WARNING: This will DELETE ALL DATA in the affected tables

-- Drop existing triggers (ignore if tables don't exist)
DO $$ BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_products_updated_at ON public.products CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_product_variants_updated_at ON public.product_variants CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_addresses_updated_at ON public.addresses CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;



DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_order_number_trigger ON public.orders CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.age_verification_logs CASCADE;

DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.verify_user_age(birth_date DATE) CASCADE;
DROP FUNCTION IF EXISTS public.generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS public.set_order_number() CASCADE;

-- Now run the complete setup from the previous migration
-- (This is the same content as 20250108000001_complete_database_setup.sql)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE public.categories (
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

-- Create products table
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  thc_content DECIMAL(5,2),
  cbd_content DECIMAL(5,2),
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

-- Create product_variants table
CREATE TABLE public.product_variants (
  id TEXT PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight_grams DECIMAL(8,2) NOT NULL,
  price INTEGER NOT NULL, -- Price in cents
  inventory_count INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  age_verified BOOLEAN DEFAULT false,
  age_verified_at TIMESTAMPTZ,
  marketing_consent BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create addresses table
CREATE TABLE public.addresses (
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

-- Create orders table
CREATE TABLE public.orders (
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

-- Create order_items table
CREATE TABLE public.order_items (
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

-- Create cart_items table
CREATE TABLE public.cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id TEXT REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, product_id, variant_id)
);

-- Create user_preferences table
CREATE TABLE public.user_preferences (
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

-- Create age_verification_logs table
CREATE TABLE public.age_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  date_of_birth DATE,
  verified BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);



-- Create notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('order_update', 'promotion', 'system', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.age_verification_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create handle new user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_preferences (user_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create age verification function
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
  
  -- Log the verification attempt
  INSERT INTO public.age_verification_logs (user_id, date_of_birth, verified)
  VALUES (auth.uid(), birth_date, is_verified);
  
  RETURN is_verified;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create order number generator
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

-- Create order number setter
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_number();

-- Create RLS Policies

-- Categories policies (public read)
CREATE POLICY "Anyone can view active categories" ON public.categories
  FOR SELECT USING (is_active = true);

-- Products policies (public read)
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);

-- Product variants policies (public read)
CREATE POLICY "Anyone can view active product variants" ON public.product_variants
  FOR SELECT USING (is_active = true);

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Addresses policies
CREATE POLICY "Users can view their own addresses" ON public.addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" ON public.addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Orders policies
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
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);



-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Age verification logs policies
CREATE POLICY "Users can view own verification logs" ON public.age_verification_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_is_featured ON public.products(is_featured);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_price ON public.products(price);
CREATE INDEX idx_products_strain_type ON public.products(strain_type);
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);

CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_is_active ON public.product_variants(is_active);

CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_is_active ON public.categories(is_active);

CREATE INDEX idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX idx_addresses_type ON public.addresses(type);
CREATE INDEX idx_addresses_is_default ON public.addresses(user_id, is_default) WHERE is_default = true;

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

CREATE INDEX idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX idx_cart_items_variant_id ON public.cart_items(variant_id);

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

CREATE INDEX idx_profiles_age_verified ON public.profiles(age_verified);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read) WHERE is_read = false;



-- Insert initial categories
INSERT INTO public.categories (name, slug, description, sort_order, is_active) VALUES
  ('Flower', 'flower', 'Premium cannabis flower, hand-selected and lab-tested', 1, true),
  ('Edibles', 'edibles', 'Delicious THC-infused treats and beverages', 2, true),
  ('Pre-Rolls', 'pre-rolls', 'Perfectly rolled joints ready to enjoy', 3, true),
  ('Concentrates', 'concentrates', 'Potent extracts and concentrates', 4, true),
  ('Topicals', 'topicals', 'Cannabis-infused creams and balms', 5, true),
  ('Accessories', 'accessories', 'Everything you need for the perfect session', 6, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert the four new cannabis products
INSERT INTO public.products (id, name, description, category, image_url, thc_content, cbd_content, is_active, slug, price) VALUES
  -- Pineapple Fruz
  ('11111111-1111-1111-1111-111111111111', 
   'Pineapple Fruz', 
   'Experience tropical paradise with Pineapple Fruz, a premium hybrid strain that delivers an explosion of sweet pineapple flavors with subtle fruity undertones. This carefully cultivated flower offers a perfect balance of uplifting cerebral effects and gentle body relaxation. Known for its dense, trichome-covered buds and vibrant orange hairs, Pineapple Fruz is ideal for creative activities, social gatherings, or simply unwinding after a long day. Lab-tested for purity and potency.', 
   'flower', 
   '/src/assets/products/pineapple-fruz/pineapple-fruz-1.jpeg', 
   23.5, 
   0.8, 
   true,
   'pineapple-fruz',
   55.00),
  
  -- Rainbow Sherbert #11
  ('22222222-2222-2222-2222-222222222222', 
   'Rainbow Sherbert #11', 
   'Rainbow Sherbert #11, also known as RS11, is an exclusive phenotype that combines the best traits of its legendary lineage. This indica-dominant hybrid boasts a complex terpene profile featuring sweet, creamy sherbert notes with hints of fruit and gas. The effects are equally impressive, offering deep relaxation without heavy sedation, making it perfect for evening use. With its stunning purple and green coloration covered in a thick layer of crystalline trichomes, RS11 is a true connoisseur''s choice. Premium indoor-grown and hand-trimmed.', 
   'flower', 
   '/src/assets/products/rs11/rainbow-sherbert11-1.jpeg', 
   26.2, 
   0.5, 
   true,
   'rainbow-sherbert-11',
   65.00),
  
  -- Runtz
  ('33333333-3333-3333-3333-333333333333', 
   'Runtz', 
   'Indulge in the award-winning Runtz strain, a perfectly balanced hybrid that has taken the cannabis world by storm. This Zkittlez x Gelato cross delivers an incredibly smooth smoke with a sweet, fruity candy flavor that lives up to its name. Runtz produces euphoric and uplifting effects that gradually transition into full-body relaxation, making it versatile for any time of day. The beautiful purple and green buds are generously coated with resinous trichomes, indicating its premium quality and potency. Grown with meticulous care and attention to detail.', 
   'flower', 
   '/src/assets/products/runtz/runtz-1.jpeg', 
   24.8, 
   0.6, 
   true,
   'runtz',
   60.00),
  
  -- Wedding Cake
  ('44444444-4444-4444-4444-444444444444', 
   'Wedding Cake', 
   'Wedding Cake, also known as Pink Cookies, is a potent indica-hybrid that delivers exceptional flavor and effects. This Triangle Kush x Animal Mints cross features a rich, tangy flavor profile with undertones of vanilla and earth. Known for its relaxing and euphoric effects, Wedding Cake is perfect for unwinding in the evening or managing stress and discomfort. The dense, colorful buds showcase a thick coating of trichomes that give it a cake-like appearance. This premium strain is cultivated indoors under optimal conditions to ensure maximum potency and flavor.', 
   'flower', 
   '/src/assets/products/wedding-cake/wedding-cake-1.jpeg', 
   25.5, 
   0.4, 
   true,
   'wedding-cake',
   60.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  thc_content = EXCLUDED.thc_content,
  cbd_content = EXCLUDED.cbd_content,
  slug = EXCLUDED.slug,
  price = EXCLUDED.price;

-- Update product metadata
UPDATE products SET 
  gallery_urls = ARRAY[
    '/src/assets/products/pineapple-fruz/pineapple-fruz-1.jpeg',
    '/src/assets/products/pineapple-fruz/pineapple-fruz-2.jpeg',
    '/src/assets/products/pineapple-fruz/pineapple-fruz-3.jpeg'
  ],
  effects = ARRAY['euphoric', 'creative', 'relaxed', 'happy', 'uplifted'],
  flavors = ARRAY['pineapple', 'tropical', 'sweet', 'citrus', 'fruity'],
  strain_type = 'hybrid',
  lab_tested = true,
  is_featured = true
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE products SET 
  gallery_urls = ARRAY[
    '/src/assets/products/rs11/rainbow-sherbert11-1.jpeg',
    '/src/assets/products/rs11/rainbow-sherbert11-2.jpeg'
  ],
  effects = ARRAY['relaxed', 'euphoric', 'sleepy', 'happy', 'hungry'],
  flavors = ARRAY['sweet', 'berry', 'creamy', 'fruity', 'gas'],
  strain_type = 'indica',
  lab_tested = true,
  is_featured = true
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE products SET 
  gallery_urls = ARRAY[
    '/src/assets/products/runtz/runtz-1.jpeg',
    '/src/assets/products/runtz/runtz-2.jpeg',
    '/src/assets/products/runtz/runtz-3.jpeg'
  ],
  effects = ARRAY['euphoric', 'uplifted', 'happy', 'relaxed', 'tingly'],
  flavors = ARRAY['sweet', 'fruity', 'candy', 'tropical', 'berry'],
  strain_type = 'hybrid',
  lab_tested = true,
  is_featured = true
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE products SET 
  gallery_urls = ARRAY[
    '/src/assets/products/wedding-cake/wedding-cake-1.jpeg',
    '/src/assets/products/wedding-cake/wedding-cake-2.jpeg',
    '/src/assets/products/wedding-cake/wedding-cake-3.jpeg'
  ],
  effects = ARRAY['relaxed', 'euphoric', 'happy', 'uplifted', 'hungry'],
  flavors = ARRAY['vanilla', 'sweet', 'earthy', 'pepper', 'flowery'],
  strain_type = 'hybrid',
  lab_tested = true,
  is_featured = true
WHERE id = '44444444-4444-4444-4444-444444444444';

-- Insert product variants
INSERT INTO public.product_variants (id, product_id, name, weight_grams, price, inventory_count, is_active) VALUES
  -- Pineapple Fruz variants
  ('pv_pf_eighth', '11111111-1111-1111-1111-111111111111', '1/8 oz (3.5g)', 3.5, 5500, 50, true),
  ('pv_pf_quarter', '11111111-1111-1111-1111-111111111111', '1/4 oz (7g)', 7.0, 10500, 30, true),
  ('pv_pf_half', '11111111-1111-1111-1111-111111111111', '1/2 oz (14g)', 14.0, 20000, 20, true),
  ('pv_pf_ounce', '11111111-1111-1111-1111-111111111111', '1 oz (28g)', 28.0, 38000, 10, true),
  
  -- Rainbow Sherbert #11 variants
  ('pv_rs_eighth', '22222222-2222-2222-2222-222222222222', '1/8 oz (3.5g)', 3.5, 6500, 40, true),
  ('pv_rs_quarter', '22222222-2222-2222-2222-222222222222', '1/4 oz (7g)', 7.0, 12500, 25, true),
  ('pv_rs_half', '22222222-2222-2222-2222-222222222222', '1/2 oz (14g)', 14.0, 24000, 15, true),
  ('pv_rs_ounce', '22222222-2222-2222-2222-222222222222', '1 oz (28g)', 28.0, 45000, 8, true),
  
  -- Runtz variants
  ('pv_rz_eighth', '33333333-3333-3333-3333-333333333333', '1/8 oz (3.5g)', 3.5, 6000, 45, true),
  ('pv_rz_quarter', '33333333-3333-3333-3333-333333333333', '1/4 oz (7g)', 7.0, 11500, 28, true),
  ('pv_rz_half', '33333333-3333-3333-3333-333333333333', '1/2 oz (14g)', 14.0, 22000, 18, true),
  ('pv_rz_ounce', '33333333-3333-3333-3333-333333333333', '1 oz (28g)', 28.0, 42000, 10, true),
  
  -- Wedding Cake variants
  ('pv_wc_eighth', '44444444-4444-4444-4444-444444444444', '1/8 oz (3.5g)', 3.5, 6000, 55, true),
  ('pv_wc_quarter', '44444444-4444-4444-4444-444444444444', '1/4 oz (7g)', 7.0, 11500, 35, true),
  ('pv_wc_half', '44444444-4444-4444-4444-444444444444', '1/2 oz (14g)', 14.0, 22000, 22, true),
  ('pv_wc_ounce', '44444444-4444-4444-4444-444444444444', '1 oz (28g)', 28.0, 42000, 12, true)
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  name = EXCLUDED.name,
  weight_grams = EXCLUDED.weight_grams,
  price = EXCLUDED.price,
  inventory_count = EXCLUDED.inventory_count,
  is_active = EXCLUDED.is_active; 