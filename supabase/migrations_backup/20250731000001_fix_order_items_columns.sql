-- Fix missing columns in order_items table
DO $$ 
BEGIN
  -- Add product_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items' 
    AND column_name = 'product_name'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN product_name TEXT;
  END IF;

  -- Add product_description if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items' 
    AND column_name = 'product_description'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN product_description TEXT;
  END IF;

  -- Add product_category if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items' 
    AND column_name = 'product_category'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN product_category TEXT;
  END IF;

  -- Add product_strain_type if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items' 
    AND column_name = 'product_strain_type'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN product_strain_type TEXT;
  END IF;

  -- Add product_thc_percentage if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items' 
    AND column_name = 'product_thc_percentage'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN product_thc_percentage DECIMAL(5,2);
  END IF;

  -- Add product_cbd_percentage if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items' 
    AND column_name = 'product_cbd_percentage'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN product_cbd_percentage DECIMAL(5,2);
  END IF;

  -- Add product_weight_grams if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items' 
    AND column_name = 'product_weight_grams'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN product_weight_grams DECIMAL(8,2);
  END IF;

  -- Add total_price if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items' 
    AND column_name = 'total_price'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN total_price DECIMAL(10,2);
  END IF;
END $$;

-- Update the total_price to be computed if null
UPDATE public.order_items 
SET total_price = quantity * unit_price 
WHERE total_price IS NULL;

-- Fix customer_email column in orders table
DO $$ 
BEGIN
  -- Add customer_email if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN customer_email TEXT;
  END IF;
END $$;