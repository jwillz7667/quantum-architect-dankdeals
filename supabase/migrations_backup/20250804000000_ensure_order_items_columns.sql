-- Ensure all required columns exist in order_items table
-- This migration ensures the order_items table has all columns needed for the email function

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

-- Update total_price for existing records where it's null
UPDATE public.order_items 
SET total_price = quantity * unit_price 
WHERE total_price IS NULL;

-- Populate product snapshot data for existing orders where missing
UPDATE public.order_items oi
SET 
  product_name = COALESCE(oi.product_name, p.name),
  product_description = COALESCE(oi.product_description, p.description),
  product_category = COALESCE(oi.product_category, p.category),
  product_strain_type = COALESCE(oi.product_strain_type, p.strain_type),
  product_thc_percentage = COALESCE(oi.product_thc_percentage, p.thc_content),
  product_cbd_percentage = COALESCE(oi.product_cbd_percentage, p.cbd_content)
FROM public.products p
WHERE oi.product_id = p.id
AND (
  oi.product_name IS NULL OR
  oi.product_category IS NULL OR
  oi.product_strain_type IS NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);