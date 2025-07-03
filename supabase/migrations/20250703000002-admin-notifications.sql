-- supabase/migrations/20250703000002-admin-notifications.sql

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('order', 'inventory', 'user', 'system', 'payment')),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_admin_notifications_admin_id ON public.admin_notifications(admin_id);
CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);
CREATE INDEX idx_admin_notifications_is_read ON public.admin_notifications(is_read);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view own notifications" ON public.admin_notifications
FOR SELECT USING (admin_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.admin_notifications
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update own notifications" ON public.admin_notifications
FOR UPDATE USING (admin_id = auth.uid());

CREATE POLICY "Admins can delete own notifications" ON public.admin_notifications
FOR DELETE USING (admin_id = auth.uid());

-- Function to create admin notification
CREATE OR REPLACE FUNCTION public.create_admin_notification(
  p_type text,
  p_title text,
  p_message text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  -- Insert notification for all admins
  INSERT INTO public.admin_notifications (admin_id, type, title, message, metadata)
  SELECT 
    p.user_id,
    p_type,
    p_title,
    p_message,
    p_metadata
  FROM public.profiles p
  WHERE p.role = 'admin'
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Function to notify specific admin
CREATE OR REPLACE FUNCTION public.notify_admin(
  p_admin_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO public.admin_notifications (admin_id, type, title, message, metadata)
  VALUES (p_admin_id, p_type, p_title, p_message, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Trigger to notify admins on new order
CREATE OR REPLACE FUNCTION public.notify_admins_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_name text;
BEGIN
  -- Get customer name
  SELECT COALESCE(first_name || ' ' || last_name, email)
  INTO v_customer_name
  FROM public.profiles
  WHERE user_id = NEW.customer_id;
  
  -- Create notification
  PERFORM public.create_admin_notification(
    'order',
    'New Order Received',
    format('Order #%s from %s - $%s', 
      NEW.order_number, 
      v_customer_name, 
      NEW.total_amount
    ),
    jsonb_build_object(
      'orderId', NEW.id,
      'orderNumber', NEW.order_number,
      'customerId', NEW.customer_id,
      'amount', NEW.total_amount,
      'severity', 'medium'
    )
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to notify admins on low inventory
CREATE OR REPLACE FUNCTION public.notify_admins_low_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_name text;
  v_threshold integer;
BEGIN
  -- Only notify if inventory is below threshold
  SELECT low_inventory_threshold INTO v_threshold
  FROM public.notification_settings
  LIMIT 1;
  
  IF v_threshold IS NULL THEN
    v_threshold := 10; -- Default threshold
  END IF;
  
  IF NEW.inventory_count <= v_threshold AND OLD.inventory_count > v_threshold THEN
    -- Get product name
    SELECT name INTO v_product_name
    FROM public.products
    WHERE id = NEW.product_id;
    
    -- Create notification
    PERFORM public.create_admin_notification(
      'inventory',
      'Low Inventory Alert',
      format('%s - Only %s units remaining', 
        v_product_name, 
        NEW.inventory_count
      ),
      jsonb_build_object(
        'productId', NEW.product_id,
        'variantId', NEW.id,
        'currentStock', NEW.inventory_count,
        'severity', CASE 
          WHEN NEW.inventory_count <= 5 THEN 'high'
          ELSE 'medium'
        END
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to notify admins on new user registration
CREATE OR REPLACE FUNCTION public.notify_admins_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if notifications are enabled
  IF EXISTS (
    SELECT 1 FROM public.notification_settings
    WHERE email_new_user = true
    LIMIT 1
  ) THEN
    -- Create notification
    PERFORM public.create_admin_notification(
      'user',
      'New User Registration',
      format('%s just signed up', 
        COALESCE(NEW.first_name || ' ' || NEW.last_name, NEW.email)
      ),
      jsonb_build_object(
        'userId', NEW.user_id,
        'email', NEW.email,
        'severity', 'low'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply triggers
CREATE TRIGGER notify_admins_on_new_order
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_order();

CREATE TRIGGER notify_admins_on_low_inventory
AFTER UPDATE ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_low_inventory();

CREATE TRIGGER notify_admins_on_new_user
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_user();

-- Update notification_settings table to include new fields
ALTER TABLE public.notification_settings
ADD COLUMN IF NOT EXISTS sound_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS desktop_notifications boolean DEFAULT true; 