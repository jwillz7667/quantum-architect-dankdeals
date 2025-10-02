-- Change product_variants.price from INTEGER to NUMERIC(10,2)
-- This allows decimal prices (e.g., $12.99) instead of forcing whole dollars

-- Check current prices to ensure no data loss
DO $$
DECLARE
  max_price INTEGER;
  variant_count INTEGER;
BEGIN
  SELECT MAX(price), COUNT(*) INTO max_price, variant_count
  FROM product_variants;

  RAISE NOTICE '% product variants found with max price: $%', variant_count, max_price;
END $$;

-- Convert price column from INTEGER to NUMERIC(10,2)
ALTER TABLE product_variants
  ALTER COLUMN price TYPE numeric(10,2) USING price::numeric(10,2);

COMMENT ON COLUMN product_variants.price IS
'Variant price in USD. Changed from INTEGER to NUMERIC(10,2) to support decimal prices (e.g., $12.99) for consistency with products.price.';

-- Verify the change
DO $$
DECLARE
  price_type TEXT;
BEGIN
  SELECT data_type INTO price_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'product_variants'
    AND column_name = 'price';

  RAISE NOTICE 'product_variants.price type: %', price_type;

  IF price_type != 'numeric' THEN
    RAISE WARNING 'Expected price column to be numeric, but got %', price_type;
  ELSE
    RAISE NOTICE '✅ Price column successfully converted to NUMERIC(10,2)';
  END IF;
END $$;
