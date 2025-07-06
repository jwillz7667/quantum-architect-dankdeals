-- Migration: Age Verification System
-- Description: Server-side age verification with RLS enforcement

-- Add age verification fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS age_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS age_verified BOOLEAN GENERATED ALWAYS AS (
  CASE 
    WHEN date_of_birth IS NOT NULL AND 
         EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) >= 21 
    THEN true 
    ELSE false 
  END
) STORED;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_age_verified ON public.profiles(age_verified);

-- Create function to verify age
CREATE OR REPLACE FUNCTION public.verify_user_age(birth_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
  IF birth_date IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update the user's date of birth
  UPDATE public.profiles
  SET 
    date_of_birth = birth_date,
    age_verified_at = NOW()
  WHERE user_id = auth.uid();
  
  -- Return whether they're 21+
  RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) >= 21;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is age verified
CREATE OR REPLACE FUNCTION public.is_age_verified(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = check_user_id
    AND age_verified = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to enforce age verification

-- Products: Only age-verified users can view
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products viewable by age-verified users" ON public.products
  FOR SELECT
  USING (
    -- Allow if user is age verified or if it's a public request (for SEO)
    auth.uid() IS NULL OR 
    is_age_verified(auth.uid())
  );

-- Cart: Only age-verified users can add items
DROP POLICY IF EXISTS "Users can insert their own cart items" ON public.cart_items;
CREATE POLICY "Age-verified users can add to cart" ON public.cart_items
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND 
    is_age_verified(auth.uid())
  );

-- Orders: Only age-verified users can create orders
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Age-verified users can create orders" ON public.orders
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND 
    is_age_verified(auth.uid())
  );

-- Create table for age verification attempts (for compliance/audit)
CREATE TABLE IF NOT EXISTS public.age_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  date_of_birth DATE,
  verified BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on age verification logs
ALTER TABLE public.age_verification_logs ENABLE ROW LEVEL SECURITY;

-- Only system can insert logs
CREATE POLICY "System inserts verification logs" ON public.age_verification_logs
  FOR INSERT
  WITH CHECK (false);

-- Users can view their own logs
CREATE POLICY "Users view own verification logs" ON public.age_verification_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create function to log age verification attempts
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

-- Add comment
COMMENT ON TABLE public.age_verification_logs IS 'Audit trail for age verification attempts for compliance purposes.'; 