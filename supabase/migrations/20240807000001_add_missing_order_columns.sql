-- Add missing columns to orders table
-- These columns are required by the new order processing system

-- Add customer_email column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Add customer_phone_number column  
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_phone_number TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone_number);

-- Add comments
COMMENT ON COLUMN public.orders.customer_email IS 'Customer email address for order communications';
COMMENT ON COLUMN public.orders.customer_phone_number IS 'Customer phone number for delivery coordination';

-- Populate from existing data where possible
UPDATE public.orders o
SET customer_email = p.email
FROM public.profiles p
WHERE o.user_id = p.id
AND o.customer_email IS NULL
AND p.email IS NOT NULL;

UPDATE public.orders
SET customer_phone_number = delivery_phone
WHERE customer_phone_number IS NULL
AND delivery_phone IS NOT NULL;