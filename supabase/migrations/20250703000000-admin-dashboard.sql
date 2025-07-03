-- supabase/migrations/20250703000000-admin-dashboard.sql

-- Add admin role to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'vendor', 'driver'));

-- Create product_metrics table for tracking product performance
CREATE TABLE IF NOT EXISTS public.product_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  date date NOT NULL,
  views integer DEFAULT 0,
  cart_additions integer DEFAULT 0,
  purchases integer DEFAULT 0,
  revenue numeric(10,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(product_id, date)
);

-- Create user_metrics table for tracking user activity
CREATE TABLE IF NOT EXISTS public.user_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  login_count integer DEFAULT 0,
  page_views integer DEFAULT 0,
  orders_placed integer DEFAULT 0,
  total_spent numeric(10,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create admin_activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Product metrics policies
CREATE POLICY "Admins can view all product metrics" ON public.product_metrics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "System can insert product metrics" ON public.product_metrics
FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update product metrics" ON public.product_metrics
FOR UPDATE USING (true);

-- User metrics policies
CREATE POLICY "Admins can view all user metrics" ON public.user_metrics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can view own metrics" ON public.user_metrics
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert user metrics" ON public.user_metrics
FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update user metrics" ON public.user_metrics
FOR UPDATE USING (true);

-- Admin activity logs policies
CREATE POLICY "Admins can view activity logs" ON public.admin_activity_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert activity logs" ON public.admin_activity_logs
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Update profiles policies for admin access
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin
    WHERE admin.user_id = auth.uid() AND admin.role = 'admin'
  )
);

CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin
    WHERE admin.user_id = auth.uid() AND admin.role = 'admin'
  )
);

-- Grant admin access to orders
CREATE POLICY "Admins can view all orders" ON public.orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update orders" ON public.orders
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Grant admin access to products
CREATE POLICY "Admins can manage products" ON public.products
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage product variants" ON public.product_variants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create functions for metrics aggregation
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(date_from date DEFAULT CURRENT_DATE - INTERVAL '30 days', date_to date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_revenue', COALESCE(SUM(total_amount), 0),
    'total_orders', COUNT(*),
    'average_order_value', COALESCE(AVG(total_amount), 0),
    'total_customers', COUNT(DISTINCT customer_id)
  ) INTO stats
  FROM public.orders
  WHERE created_at::date BETWEEN date_from AND date_to
  AND status != 'cancelled';
  
  RETURN stats;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_product_performance(date_from date DEFAULT CURRENT_DATE - INTERVAL '30 days', date_to date DEFAULT CURRENT_DATE)
RETURNS TABLE(
  product_id uuid,
  product_name text,
  total_revenue numeric,
  total_quantity integer,
  order_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    COALESCE(SUM(oi.total_price), 0) as total_revenue,
    COALESCE(SUM(oi.quantity), 0) as total_quantity,
    COUNT(DISTINCT oi.order_id) as order_count
  FROM public.products p
  LEFT JOIN public.product_variants pv ON p.id = pv.product_id
  LEFT JOIN public.order_items oi ON pv.id = oi.product_variant_id
  LEFT JOIN public.orders o ON oi.order_id = o.id
  WHERE o.created_at::date BETWEEN date_from AND date_to
  AND o.status != 'cancelled'
  GROUP BY p.id, p.name
  ORDER BY total_revenue DESC;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_metrics_product_date ON public.product_metrics(product_id, date);
CREATE INDEX IF NOT EXISTS idx_user_metrics_user_date ON public.user_metrics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created ON public.admin_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Set up initial admin user (update the user_id with your admin user's ID)
-- UPDATE public.profiles SET role = 'admin' WHERE user_id = 'YOUR_ADMIN_USER_ID';

-- Create a trigger to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin') THEN
    INSERT INTO public.admin_activity_logs (admin_id, action, entity_type, entity_id, details)
    VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.id
        ELSE NEW.id
      END,
      jsonb_build_object(
        'old', row_to_json(OLD),
        'new', row_to_json(NEW)
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Apply admin action logging to sensitive tables
CREATE TRIGGER log_product_changes
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

CREATE TRIGGER log_order_changes
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

CREATE TRIGGER log_user_profile_changes
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.log_admin_action(); 