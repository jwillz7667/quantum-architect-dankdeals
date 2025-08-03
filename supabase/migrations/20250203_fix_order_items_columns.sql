-- Add missing product snapshot columns to order_items table
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS product_description TEXT,
ADD COLUMN IF NOT EXISTS product_category TEXT,
ADD COLUMN IF NOT EXISTS product_strain_type TEXT,
ADD COLUMN IF NOT EXISTS product_thc_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS product_cbd_percentage DECIMAL(5,2);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);