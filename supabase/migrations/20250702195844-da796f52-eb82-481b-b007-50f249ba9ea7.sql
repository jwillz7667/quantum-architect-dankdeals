-- Add some sample products for demonstration
-- First, get vendor IDs
DO $$
DECLARE
    vendor1_id uuid;
    vendor2_id uuid;
    vendor3_id uuid;
    product1_id uuid;
    product2_id uuid;
    product3_id uuid;
    product4_id uuid;
BEGIN
    -- Get existing vendor IDs or create them if they don't exist
    SELECT id INTO vendor1_id FROM vendors WHERE name = 'Green Valley Dispensary' LIMIT 1;
    SELECT id INTO vendor2_id FROM vendors WHERE name = 'Premium Cannabis Collective' LIMIT 1;
    SELECT id INTO vendor3_id FROM vendors WHERE name = 'Metro Cannabis Market' LIMIT 1;
    
    -- If no vendors exist, create them
    IF vendor1_id IS NULL THEN
        INSERT INTO vendors (name, email, license_number, slug, status) 
        VALUES ('Green Valley Dispensary', 'info@greenvalley.com', 'LIC-001', 'green-valley', 'active')
        RETURNING id INTO vendor1_id;
    END IF;
    
    IF vendor2_id IS NULL THEN
        INSERT INTO vendors (name, email, license_number, slug, status) 
        VALUES ('Premium Cannabis Collective', 'info@premiumcannabis.com', 'LIC-002', 'premium-cannabis', 'active')
        RETURNING id INTO vendor2_id;
    END IF;
    
    IF vendor3_id IS NULL THEN
        INSERT INTO vendors (name, email, license_number, slug, status) 
        VALUES ('Metro Cannabis Market', 'info@metrocannabis.com', 'LIC-003', 'metro-cannabis', 'active')
        RETURNING id INTO vendor3_id;
    END IF;

    -- Insert Blue Dream product
    INSERT INTO products (name, description, category, thc_content, cbd_content, vendor_id, slug, is_active)
    VALUES (
        'Blue Dream',
        'Blue Dream is one of the most popular strains you can share with friends. This sativa-dominant hybrid offers a balanced experience with sweet berry aromas.',
        'flower',
        18.5,
        0.5,
        vendor1_id,
        'blue-dream',
        true
    ) RETURNING id INTO product1_id;

    -- Insert variants for Blue Dream
    INSERT INTO product_variants (product_id, name, price, weight_grams, inventory_count, is_active)
    VALUES 
        (product1_id, '1g', 1500, 1.0, 25, true),
        (product1_id, '3.5g (1/8 oz)', 4500, 3.5, 15, true),
        (product1_id, '7g (1/4 oz)', 8500, 7.0, 8, true);

    -- Insert OG Kush product
    INSERT INTO products (name, description, category, thc_content, cbd_content, vendor_id, slug, is_active)
    VALUES (
        'OG Kush',
        'A legendary strain with a unique terpene profile that boasts a complex aroma with notes of fuel, skunk, and spice.',
        'flower',
        22.0,
        0.3,
        vendor2_id,
        'og-kush',
        true
    ) RETURNING id INTO product2_id;

    -- Insert variants for OG Kush
    INSERT INTO product_variants (product_id, name, price, weight_grams, inventory_count, is_active)
    VALUES 
        (product2_id, '1g', 1800, 1.0, 20, true),
        (product2_id, '3.5g (1/8 oz)', 5500, 3.5, 12, true),
        (product2_id, '7g (1/4 oz)', 10500, 7.0, 6, true);

    -- Insert Berry Gummies product
    INSERT INTO products (name, description, category, thc_content, cbd_content, vendor_id, slug, is_active)
    VALUES (
        'Berry Gummies',
        'Delicious mixed berry gummies infused with premium cannabis extract. Perfect for precise dosing and great taste.',
        'edibles',
        10.0,
        0.0,
        vendor3_id,
        'berry-gummies',
        true
    ) RETURNING id INTO product3_id;

    -- Insert variants for Berry Gummies
    INSERT INTO product_variants (product_id, name, price, weight_grams, inventory_count, is_active)
    VALUES 
        (product3_id, '5mg (10-pack)', 2500, 50.0, 30, true),
        (product3_id, '10mg (10-pack)', 4500, 50.0, 25, true);

    -- Insert Pre-Roll Joints product
    INSERT INTO products (name, description, category, thc_content, cbd_content, vendor_id, slug, is_active)
    VALUES (
        'Pre-Roll Joints',
        'Premium pre-rolled joints made with top-shelf flower. Perfectly rolled and ready to enjoy.',
        'prerolls',
        20.0,
        0.5,
        vendor1_id,
        'pre-roll-joints',
        true
    ) RETURNING id INTO product4_id;

    -- Insert variants for Pre-Roll Joints
    INSERT INTO product_variants (product_id, name, price, weight_grams, inventory_count, is_active)
    VALUES 
        (product4_id, 'Single Joint (1g)', 1200, 1.0, 50, true),
        (product4_id, '3-Pack', 3200, 3.0, 20, true),
        (product4_id, '5-Pack', 5000, 5.0, 15, true);

END $$;