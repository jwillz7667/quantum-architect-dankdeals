-- Fix critical security vulnerability in orders table RLS policies
-- Remove the policy that allows public access to guest orders

DROP POLICY IF EXISTS "Allow viewing orders by user or order number" ON public.orders;

-- Create secure policies for order access
-- 1. Authenticated users can only view their own orders
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- 2. Create a secure function for guest order lookup that requires email verification
CREATE OR REPLACE FUNCTION public.get_guest_order(order_number_param TEXT, customer_email_param TEXT)
RETURNS SETOF public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return the order if both order number and email match exactly
  -- This provides a secure way for guests to access their orders
  RETURN QUERY
  SELECT * FROM public.orders 
  WHERE order_number = order_number_param 
  AND customer_email = customer_email_param
  AND user_id IS NULL;
END;
$$;