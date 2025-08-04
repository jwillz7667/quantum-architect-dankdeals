-- Add customer_email field to orders table for better guest order support
-- This field will store the email address for both guest and authenticated orders

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Add an index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);

-- Update existing orders to populate customer_email from notes field where possible
UPDATE public.orders 
SET customer_email = 
  CASE 
    WHEN notes LIKE '%Email: %' THEN
      TRIM(SUBSTRING(notes FROM 'Email: ([^,]+)'))
    ELSE NULL
  END
WHERE customer_email IS NULL 
  AND notes IS NOT NULL 
  AND notes LIKE '%Email: %';

-- Add a comment explaining the field
COMMENT ON COLUMN public.orders.customer_email IS 'Customer email address for order communications. Used for both guest and authenticated orders.';