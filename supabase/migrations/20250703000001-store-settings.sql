-- supabase/migrations/20250703000001-store-settings.sql

-- Drop existing tables if they exist (to handle schema changes)
DROP TABLE IF EXISTS public.report_history CASCADE;
DROP TABLE IF EXISTS public.scheduled_reports CASCADE;
DROP TABLE IF EXISTS public.security_settings CASCADE;
DROP TABLE IF EXISTS public.notification_settings CASCADE;
DROP TABLE IF EXISTS public.delivery_zones CASCADE;
DROP TABLE IF EXISTS public.store_settings CASCADE;

-- Create store_settings table
CREATE TABLE public.store_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name text NOT NULL DEFAULT 'DankDeals',
  store_email text NOT NULL DEFAULT 'admin@dankdealsmn.com',
  store_phone text DEFAULT '(555) 123-4567',
  store_address text DEFAULT '123 Main St, Minneapolis, MN 55401',
  business_hours jsonb NOT NULL DEFAULT '{
    "monday": {"open": "10:00", "close": "20:00", "closed": false},
    "tuesday": {"open": "10:00", "close": "20:00", "closed": false},
    "wednesday": {"open": "10:00", "close": "20:00", "closed": false},
    "thursday": {"open": "10:00", "close": "20:00", "closed": false},
    "friday": {"open": "10:00", "close": "21:00", "closed": false},
    "saturday": {"open": "10:00", "close": "21:00", "closed": false},
    "sunday": {"open": "12:00", "close": "18:00", "closed": false}
  }'::jsonb,
  timezone text DEFAULT 'America/Chicago',
  currency text DEFAULT 'USD',
  order_minimum numeric(10,2) DEFAULT 50.00,
  delivery_fee numeric(10,2) DEFAULT 5.00,
  tax_rate numeric(5,3) DEFAULT 8.775,
  max_delivery_radius integer DEFAULT 10,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create delivery_zones table
CREATE TABLE public.delivery_zones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  zip_code text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  is_active boolean DEFAULT true,
  delivery_fee numeric(10,2),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(zip_code)
);

-- Create notification_settings table
CREATE TABLE public.notification_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email_new_order boolean DEFAULT true,
  email_order_canceled boolean DEFAULT true,
  email_low_inventory boolean DEFAULT true,
  email_new_user boolean DEFAULT false,
  sms_new_order boolean DEFAULT false,
  sms_order_canceled boolean DEFAULT false,
  low_inventory_threshold integer DEFAULT 10,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(admin_id)
);

-- Create security_settings table
CREATE TABLE public.security_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  two_factor_required boolean DEFAULT false,
  session_timeout integer DEFAULT 30,
  password_expiry integer DEFAULT 90,
  max_login_attempts integer DEFAULT 5,
  ip_whitelist text[] DEFAULT '{}',
  audit_log_retention integer DEFAULT 90,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create scheduled_reports table
CREATE TABLE public.scheduled_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type text NOT NULL,
  schedule text NOT NULL CHECK (schedule IN ('daily', 'weekly', 'monthly')),
  recipients text[] NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  last_run timestamp with time zone,
  next_run timestamp with time zone,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create report_history table
CREATE TABLE public.report_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type text NOT NULL,
  date_range jsonb NOT NULL,
  generated_by uuid REFERENCES auth.users(id),
  file_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

-- Store settings policies (only admins can view/edit)
CREATE POLICY "Admins can view store settings" ON public.store_settings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update store settings" ON public.store_settings
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Delivery zones policies
CREATE POLICY "Anyone can view active delivery zones" ON public.delivery_zones
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage delivery zones" ON public.delivery_zones
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Notification settings policies
CREATE POLICY "Admins can view own notification settings" ON public.notification_settings
FOR SELECT USING (admin_id = auth.uid());

CREATE POLICY "Admins can manage own notification settings" ON public.notification_settings
FOR ALL USING (admin_id = auth.uid());

-- Security settings policies (super admin only)
CREATE POLICY "Super admins can view security settings" ON public.security_settings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Super admins can update security settings" ON public.security_settings
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Scheduled reports policies
CREATE POLICY "Admins can view scheduled reports" ON public.scheduled_reports
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage scheduled reports" ON public.scheduled_reports
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Report history policies
CREATE POLICY "Admins can view report history" ON public.report_history
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can create report history" ON public.report_history
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default store settings
INSERT INTO public.store_settings (id) VALUES (gen_random_uuid());

-- Insert default security settings
INSERT INTO public.security_settings (id) VALUES (gen_random_uuid());

-- Insert default delivery zones for Minneapolis
INSERT INTO public.delivery_zones (zip_code, city, state) VALUES
  ('55401', 'Minneapolis', 'MN'),
  ('55402', 'Minneapolis', 'MN'),
  ('55403', 'Minneapolis', 'MN'),
  ('55404', 'Minneapolis', 'MN'),
  ('55405', 'Minneapolis', 'MN'),
  ('55406', 'Minneapolis', 'MN'),
  ('55407', 'Minneapolis', 'MN'),
  ('55408', 'Minneapolis', 'MN'),
  ('55409', 'Minneapolis', 'MN'),
  ('55410', 'Minneapolis', 'MN'),
  ('55411', 'Minneapolis', 'MN'),
  ('55412', 'Minneapolis', 'MN'),
  ('55413', 'Minneapolis', 'MN'),
  ('55414', 'Minneapolis', 'MN'),
  ('55415', 'Minneapolis', 'MN'),
  ('55416', 'Minneapolis', 'MN'),
  ('55417', 'Minneapolis', 'MN'),
  ('55418', 'Minneapolis', 'MN'),
  ('55419', 'Minneapolis', 'MN'),
  ('55454', 'Minneapolis', 'MN'),
  ('55455', 'Minneapolis', 'MN');

-- Create update timestamp triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_zones_updated_at BEFORE UPDATE ON public.delivery_zones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_security_settings_updated_at BEFORE UPDATE ON public.security_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at BEFORE UPDATE ON public.scheduled_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); 