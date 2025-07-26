-- Update product prices to new pricing structure
-- 1/8 oz = $40
-- 1/4 oz = $75  
-- 1/2 oz = $140
-- 1 oz = $250

-- Update all product variants with the new prices
UPDATE product_variants 
SET price = CASE
    WHEN name = '1/8 oz' THEN 40.00
    WHEN name = '1/4 oz' THEN 75.00
    WHEN name = '1/2 oz' THEN 140.00
    WHEN name = '1 oz' THEN 250.00
    ELSE price
END
WHERE name IN ('1/8 oz', '1/4 oz', '1/2 oz', '1 oz');

-- Verify the updates
SELECT p.name as product_name, pv.name as variant_name, pv.price, pv.weight_grams
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
ORDER BY p.name, pv.weight_grams;