-- Emergency fix for missing columns in orders table

-- Add customer_email if it doesn't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Add customer_phone_number if it doesn't exist  
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_phone_number TEXT;

-- Add discount_amount if it doesn't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- Update existing rows to have customer_email from profiles if available
UPDATE public.orders o
SET customer_email = p.email
FROM public.profiles p
WHERE o.user_id = p.id
AND o.customer_email IS NULL
AND p.email IS NOT NULL;

-- Update existing rows to have customer_phone_number from delivery_phone
UPDATE public.orders
SET customer_phone_number = delivery_phone
WHERE customer_phone_number IS NULL
AND delivery_phone IS NOT NULL;