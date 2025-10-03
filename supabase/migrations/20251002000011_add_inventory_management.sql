-- Add automatic inventory management system
-- This ensures product_variants.inventory_count is properly tracked when orders are placed

-- Step 1: Add variant_id to order_items if not exists
-- (This is needed for inventory tracking - also addresses issue #3)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'order_items'
    AND column_name = 'product_variant_id'
  ) THEN
    ALTER TABLE public.order_items
    ADD COLUMN product_variant_id TEXT REFERENCES public.product_variants(id) ON DELETE SET NULL;

    -- Add index for performance
    CREATE INDEX idx_order_items_variant_id ON public.order_items(product_variant_id);

    COMMENT ON COLUMN public.order_items.product_variant_id IS
    'References the specific product variant (size/weight) that was ordered. Used for inventory tracking and order fulfillment.';
  END IF;
END $$;

-- Step 2: Create function to handle inventory deduction
CREATE OR REPLACE FUNCTION decrement_variant_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_inventory INTEGER;
  variant_name TEXT;
BEGIN
  -- Only process if variant_id is provided
  IF NEW.product_variant_id IS NOT NULL THEN

    -- Get current inventory count
    SELECT inventory_count, name INTO current_inventory, variant_name
    FROM product_variants
    WHERE id = NEW.product_variant_id;

    -- Check if variant exists
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product variant % does not exist', NEW.product_variant_id;
    END IF;

    -- Check if sufficient inventory available
    IF current_inventory IS NOT NULL AND current_inventory < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient inventory for variant "%". Available: %, Requested: %',
        variant_name, current_inventory, NEW.quantity;
    END IF;

    -- Decrement inventory (only if inventory_count is tracked)
    IF current_inventory IS NOT NULL THEN
      UPDATE product_variants
      SET
        inventory_count = inventory_count - NEW.quantity,
        updated_at = NOW()
      WHERE id = NEW.product_variant_id;

      -- Log the inventory change for audit purposes
      RAISE NOTICE 'Decremented inventory for variant % (%) by % units. New inventory: %',
        NEW.product_variant_id, variant_name, NEW.quantity, (current_inventory - NEW.quantity);
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- Step 3: Create function to handle inventory restoration (for cancelled orders)
CREATE OR REPLACE FUNCTION restore_variant_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  order_status TEXT;
BEGIN
  -- Only restore inventory if order was cancelled
  SELECT status INTO order_status
  FROM orders
  WHERE id = OLD.order_id;

  IF order_status = 'cancelled' AND OLD.product_variant_id IS NOT NULL THEN

    -- Restore inventory
    UPDATE product_variants
    SET
      inventory_count = COALESCE(inventory_count, 0) + OLD.quantity,
      updated_at = NOW()
    WHERE id = OLD.product_variant_id
      AND inventory_count IS NOT NULL; -- Only restore if inventory is tracked

    RAISE NOTICE 'Restored inventory for variant % by % units (order cancelled)',
      OLD.product_variant_id, OLD.quantity;

  END IF;

  RETURN OLD;
END;
$$;

-- Step 4: Create trigger to decrement inventory when order item is created
DROP TRIGGER IF EXISTS trigger_decrement_inventory ON public.order_items;
CREATE TRIGGER trigger_decrement_inventory
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION decrement_variant_inventory();

-- Step 5: Create trigger to restore inventory when order item is deleted (cancelled orders)
DROP TRIGGER IF EXISTS trigger_restore_inventory ON public.order_items;
CREATE TRIGGER trigger_restore_inventory
  BEFORE DELETE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION restore_variant_inventory();

-- Step 6: Add helpful function to check low inventory
CREATE OR REPLACE FUNCTION get_low_inventory_variants(threshold INTEGER DEFAULT 10)
RETURNS TABLE (
  variant_id TEXT,
  product_id UUID,
  product_name TEXT,
  variant_name TEXT,
  current_inventory INTEGER,
  is_active BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    pv.id AS variant_id,
    pv.product_id,
    p.name AS product_name,
    pv.name AS variant_name,
    pv.inventory_count AS current_inventory,
    pv.is_active
  FROM product_variants pv
  JOIN products p ON p.id = pv.product_id
  WHERE pv.inventory_count IS NOT NULL
    AND pv.inventory_count <= threshold
    AND pv.is_active = true
    AND p.is_active = true
  ORDER BY pv.inventory_count ASC, p.name, pv.name;
$$;

COMMENT ON FUNCTION get_low_inventory_variants(INTEGER) IS
'Returns all active product variants with inventory below the specified threshold. Default threshold is 10 units.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION decrement_variant_inventory() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION restore_variant_inventory() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_low_inventory_variants(INTEGER) TO authenticated;

-- Add comments
COMMENT ON FUNCTION decrement_variant_inventory() IS
'Automatically decrements product variant inventory when an order item is created. Includes validation to prevent overselling. Requires product_variant_id to be set on order_items.';

COMMENT ON FUNCTION restore_variant_inventory() IS
'Automatically restores product variant inventory when an order is cancelled and its items are deleted. Only restores inventory for variants that track inventory_count.';
