-- supabase/seed-products-only.sql
-- Comprehensive seed data for cannabis products - PRODUCT TABLES ONLY

-- Clear existing product data (but preserve other tables)
DELETE FROM product_variants;
DELETE FROM products;
DELETE FROM vendors;

-- Insert vendors with proper UUIDs
INSERT INTO vendors (id, name, email, phone, status, license_number, slug) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Green Valley Farms', 'contact@greenvalley.com', '612-555-0101', 'active', 'LIC-001', 'green-valley'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Urban Gardens MN', 'info@urbangardens.com', '651-555-0102', 'active', 'LIC-002', 'urban-gardens'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Northern Lights Cannabis', 'hello@northernlights.com', '763-555-0103', 'active', 'LIC-003', 'northern-lights'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Twin Cities Cultivation', 'info@twincities.com', '952-555-0104', 'active', 'LIC-004', 'twin-cities'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Prairie Cannabis Co', 'hello@prairie.com', '320-555-0105', 'active', 'LIC-005', 'prairie-cannabis')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  status = EXCLUDED.status;

-- Insert Flower Products with proper UUIDs
INSERT INTO products (id, name, description, category, image_url, thc_content, cbd_content, vendor_id, slug, is_active) VALUES
  -- Premium Flower Strains
  ('f1111111-1111-1111-1111-111111111111', 'Blue Dream', 'A legendary sativa-dominant hybrid offering balanced cerebral euphoria and full-body relaxation. Sweet berry aroma with hints of vanilla. Perfect for creative activities and social gatherings.', 'flower', '/api/placeholder/400/400', 18.5, 0.5, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'blue-dream', true),
  ('f2222222-2222-2222-2222-222222222222', 'OG Kush', 'The classic indica-dominant strain with complex earthy flavors featuring fuel, skunk, and spice notes. Provides deep relaxation and stress relief. Ideal for evening use.', 'flower', '/api/placeholder/400/400', 22.0, 0.2, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'og-kush', true),
  ('f3333333-3333-3333-3333-333333333333', 'Girl Scout Cookies', 'Popular hybrid with sweet and earthy flavors balanced by hints of mint and cherry. Delivers euphoric effects followed by waves of full-body relaxation.', 'flower', '/api/placeholder/400/400', 20.0, 0.3, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'girl-scout-cookies', true),
  ('f4444444-4444-4444-4444-444444444444', 'Sour Diesel', 'Energizing sativa with pungent diesel-like aroma and citrus undertones. Fast-acting strain perfect for daytime productivity and creativity.', 'flower', '/api/placeholder/400/400', 19.0, 0.1, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'sour-diesel', true),
  ('f5555555-5555-5555-5555-555555555555', 'Purple Haze', 'Classic sativa strain with sweet and earthy flavors and subtle grape notes. Known for uplifting, creative, and euphoric effects.', 'flower', '/api/placeholder/400/400', 17.5, 0.4, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'purple-haze', true),
  ('f6666666-6666-6666-6666-666666666666', 'Wedding Cake', 'Indica-dominant hybrid with vanilla and tangy flavor profile. Provides relaxing effects with a euphoric head high. Great for stress relief.', 'flower', '/api/placeholder/400/400', 24.0, 0.3, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'wedding-cake', true),
  ('f7777777-7777-7777-7777-777777777777', 'Green Crack', 'Energetic sativa with sweet tropical and citrus flavors. Provides mental buzz that keeps you alert and focused throughout the day.', 'flower', '/api/placeholder/400/400', 21.0, 0.2, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'green-crack', true),
  ('f8888888-8888-8888-8888-888888888888', 'Northern Lights', 'Pure indica with sweet and spicy aromas. Famous for its dreamy, euphoric effects that relax muscles and settle minds into peaceful bliss.', 'flower', '/api/placeholder/400/400', 18.0, 0.5, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'northern-lights', true),
  
  -- Pre-roll Products
  ('fa111111-1111-1111-1111-111111111111', 'Sunset Sherbet Pre-Roll Pack', 'Pack of 5 premium pre-rolls featuring Sunset Sherbet strain. Each pre-roll contains 0.5g of top-shelf flower, perfectly rolled for consistent burn.', 'prerolls', '/api/placeholder/400/400', 18.0, 0.3, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sunset-sherbet-prerolls', true),
  ('fa222222-2222-2222-2222-222222222222', 'Jack Herer Pre-Roll', 'Single 1g pre-roll of the legendary Jack Herer strain. Sativa-dominant hybrid perfect for creative inspiration and daytime energy.', 'prerolls', '/api/placeholder/400/400', 21.0, 0.2, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'jack-herer-preroll', true),
  ('fa333333-3333-3333-3333-333333333333', 'Mixed Variety Pre-Roll Pack', 'Variety pack with 3 different premium strains: Blue Dream, OG Kush, and Sour Diesel. Great for trying new favorites or sharing with friends.', 'prerolls', '/api/placeholder/400/400', 19.0, 0.5, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'mixed-variety-prerolls', true),
  ('fa444444-4444-4444-4444-444444444444', 'Indica Blend Pre-Rolls', 'Pack of 3 indica-dominant pre-rolls perfect for evening relaxation. Features Purple Kush, Granddaddy Purple, and Bubba Kush strains.', 'prerolls', '/api/placeholder/400/400', 20.5, 0.4, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'indica-blend-prerolls', true),
  ('fa555555-5555-5555-5555-555555555555', 'Sativa Energy Pack', 'Energizing sativa pre-roll 3-pack featuring Green Crack, Durban Poison, and Strawberry Cough. Perfect for daytime activities.', 'prerolls', '/api/placeholder/400/400', 19.5, 0.2, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'sativa-energy-pack', true),
  
  -- Edibles Products
  ('fb111111-1111-1111-1111-111111111111', 'Blueberry Gummies', 'Delicious blueberry-flavored gummies made with premium cannabis extract. Each package contains 10 gummies with precise 10mg THC dosing.', 'edibles', '/api/placeholder/400/400', null, null, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'blueberry-gummies', true),
  ('fb222222-2222-2222-2222-222222222222', 'Dark Chocolate Bar', 'Premium 70% dark chocolate infused with full-spectrum cannabis oil. 100mg total THC divided into 10 perfectly scored pieces for easy dosing.', 'edibles', '/api/placeholder/400/400', null, null, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dark-chocolate-bar', true),
  ('fb333333-3333-3333-3333-333333333333', 'Tropical Fruit Chews', 'Assorted tropical fruit flavors including mango, pineapple, and passion fruit. 20 soft chews per package, 5mg THC each for micro-dosing.', 'edibles', '/api/placeholder/400/400', null, null, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'tropical-fruit-chews', true),
  ('fb444444-4444-4444-4444-444444444444', 'Honey Sticks', 'Natural Minnesota wildflower honey infused with cannabis extract. Pack of 5 convenient sticks, 10mg THC each. Perfect for tea or snacking.', 'edibles', '/api/placeholder/400/400', null, null, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'honey-sticks', true),
  ('fb555555-5555-5555-5555-555555555555', 'Strawberry Lemonade Drink Mix', 'Refreshing drink powder that mixes easily with water. Each packet contains 10mg THC and delivers delicious strawberry lemonade flavor.', 'edibles', '/api/placeholder/400/400', null, null, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'strawberry-lemonade-mix', true),
  ('fb666666-6666-6666-6666-666666666666', 'Caramel Apple Bites', 'Gourmet caramel apple flavored soft chews. Premium ingredients with 5mg THC per piece. 20 pieces per package for precise dosing control.', 'edibles', '/api/placeholder/400/400', null, null, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'caramel-apple-bites', true),
  
  -- Wellness/Topical Products
  ('fc111111-1111-1111-1111-111111111111', 'CBD Tincture 1000mg', 'High-quality full-spectrum CBD oil extracted using CO2 methods. 1000mg CBD in 30ml bottle with precise dropper for easy dosing. Perfect for daily wellness routine.', 'topicals', '/api/placeholder/400/400', 0.3, 33.3, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cbd-tincture-1000mg', true),
  ('fc222222-2222-2222-2222-222222222222', 'Pain Relief Balm', 'Topical balm combining CBD with cooling menthol and warming capsaicin. Great for targeted muscle and joint relief. Non-psychoactive formula.', 'topicals', '/api/placeholder/400/400', 0.0, 5.0, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'pain-relief-balm', true),
  ('fc333333-3333-3333-3333-333333333333', 'Sleep Aid Capsules', 'CBD capsules enhanced with natural melatonin and chamomile for better sleep quality. 30 capsules per bottle, 25mg CBD each.', 'topicals', '/api/placeholder/400/400', 0.0, 25.0, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sleep-aid-capsules', true),
  ('fc444444-4444-4444-4444-444444444444', 'Focus Blend Tincture', 'Balanced CBD:THC tincture (2:1 ratio) designed to enhance focus without impairment. Contains terpenes that support mental clarity.', 'topicals', '/api/placeholder/400/400', 10.0, 20.0, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'focus-blend-tincture', true),
  ('fc555555-5555-5555-5555-555555555555', 'Recovery Bath Salts', 'Epsom salt blend infused with CBD and eucalyptus essential oils. Perfect for post-workout recovery and relaxation. 8oz container.', 'topicals', '/api/placeholder/400/400', 0.0, 15.0, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'recovery-bath-salts', true),
  ('fc666666-6666-6666-6666-666666666666', 'Daily Wellness Capsules', 'Full-spectrum CBD capsules for daily wellness support. Contains 15mg CBD plus beneficial terpenes and compounds. 60 capsules per bottle.', 'topicals', '/api/placeholder/400/400', 0.5, 15.0, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'daily-wellness-capsules', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  thc_content = EXCLUDED.thc_content,
  cbd_content = EXCLUDED.cbd_content,
  vendor_id = EXCLUDED.vendor_id,
  is_active = EXCLUDED.is_active;

-- Insert product variants with realistic pricing and inventory
INSERT INTO product_variants (id, product_id, name, weight_grams, price, inventory_count, is_active) VALUES
  -- Blue Dream variants
  ('ffffffff-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', '1/8 oz (3.5g)', 3.5, 4500, 50, true),
  ('ffffffff-1111-1111-1111-111111111112', 'f1111111-1111-1111-1111-111111111111', '1/4 oz (7g)', 7.0, 8500, 30, true),
  ('ffffffff-1111-1111-1111-111111111113', 'f1111111-1111-1111-1111-111111111111', '1/2 oz (14g)', 14.0, 16000, 20, true),
  ('ffffffff-1111-1111-1111-111111111114', 'f1111111-1111-1111-1111-111111111111', '1 oz (28g)', 28.0, 30000, 10, true),
  
  -- OG Kush variants
  ('ffffffff-2222-2222-2222-222222222221', 'f2222222-2222-2222-2222-222222222222', '1/8 oz (3.5g)', 3.5, 5000, 40, true),
  ('ffffffff-2222-2222-2222-222222222222', 'f2222222-2222-2222-2222-222222222222', '1/4 oz (7g)', 7.0, 9500, 25, true),
  ('ffffffff-2222-2222-2222-222222222223', 'f2222222-2222-2222-2222-222222222222', '1/2 oz (14g)', 14.0, 18000, 15, true),
  ('ffffffff-2222-2222-2222-222222222224', 'f2222222-2222-2222-2222-222222222222', '1 oz (28g)', 28.0, 34000, 8, true),
  
  -- Girl Scout Cookies variants
  ('ffffffff-3333-3333-3333-333333333331', 'f3333333-3333-3333-3333-333333333333', '1/8 oz (3.5g)', 3.5, 4800, 45, true),
  ('ffffffff-3333-3333-3333-333333333332', 'f3333333-3333-3333-3333-333333333333', '1/4 oz (7g)', 7.0, 9000, 28, true),
  ('ffffffff-3333-3333-3333-333333333333', 'f3333333-3333-3333-3333-333333333333', '1/2 oz (14g)', 14.0, 17000, 18, true),
  
  -- Sour Diesel variants
  ('ffffffff-4444-4444-4444-444444444441', 'f4444444-4444-4444-4444-444444444444', '1/8 oz (3.5g)', 3.5, 4600, 55, true),
  ('ffffffff-4444-4444-4444-444444444442', 'f4444444-4444-4444-4444-444444444444', '1/4 oz (7g)', 7.0, 8800, 35, true),
  ('ffffffff-4444-4444-4444-444444444443', 'f4444444-4444-4444-4444-444444444444', '1/2 oz (14g)', 14.0, 16500, 22, true),
  
  -- Purple Haze variants
  ('ffffffff-5555-5555-5555-555555555551', 'f5555555-5555-5555-5555-555555555555', '1/8 oz (3.5g)', 3.5, 4200, 60, true),
  ('ffffffff-5555-5555-5555-555555555552', 'f5555555-5555-5555-5555-555555555555', '1/4 oz (7g)', 7.0, 8000, 40, true),
  ('ffffffff-5555-5555-5555-555555555553', 'f5555555-5555-5555-5555-555555555555', '1/2 oz (14g)', 14.0, 15000, 25, true),
  
  -- Wedding Cake variants
  ('ffffffff-6666-6666-6666-666666666661', 'f6666666-6666-6666-6666-666666666666', '1/8 oz (3.5g)', 3.5, 5500, 35, true),
  ('ffffffff-6666-6666-6666-666666666662', 'f6666666-6666-6666-6666-666666666666', '1/4 oz (7g)', 7.0, 10500, 20, true),
  ('ffffffff-6666-6666-6666-666666666663', 'f6666666-6666-6666-6666-666666666666', '1/2 oz (14g)', 14.0, 20000, 12, true),
  
  -- Green Crack variants
  ('ffffffff-7777-7777-7777-777777777771', 'f7777777-7777-7777-7777-777777777777', '1/8 oz (3.5g)', 3.5, 4700, 48, true),
  ('ffffffff-7777-7777-7777-777777777772', 'f7777777-7777-7777-7777-777777777777', '1/4 oz (7g)', 7.0, 9200, 30, true),
  
  -- Northern Lights variants
  ('ffffffff-8888-8888-8888-888888888881', 'f8888888-8888-8888-8888-888888888888', '1/8 oz (3.5g)', 3.5, 4400, 52, true),
  ('ffffffff-8888-8888-8888-888888888882', 'f8888888-8888-8888-8888-888888888888', '1/4 oz (7g)', 7.0, 8600, 32, true),
  
  -- Pre-roll variants
  ('ffffffff-aaaa-1111-1111-111111111111', 'fa111111-1111-1111-1111-111111111111', '5-pack (2.5g total)', 2.5, 3500, 100, true),
  ('ffffffff-aaaa-2222-2222-222222222222', 'fa222222-2222-2222-2222-222222222222', 'Single 1g', 1.0, 1200, 150, true),
  ('ffffffff-aaaa-3333-3333-333333333333', 'fa333333-3333-3333-3333-333333333333', '3-pack variety', 1.5, 2500, 80, true),
  ('ffffffff-aaaa-4444-4444-444444444444', 'fa444444-4444-4444-4444-444444444444', '3-pack indica', 1.5, 2800, 70, true),
  ('ffffffff-aaaa-5555-5555-555555555555', 'fa555555-5555-5555-5555-555555555555', '3-pack sativa', 1.5, 2600, 85, true),
  
  -- Edible variants
  ('ffffffff-bbbb-1111-1111-111111111111', 'fb111111-1111-1111-1111-111111111111', '100mg package (10x10mg)', 0, 2500, 200, true),
  ('ffffffff-bbbb-1111-1111-111111111112', 'fb111111-1111-1111-1111-111111111111', '50mg package (10x5mg)', 0, 1500, 250, true),
  ('ffffffff-bbbb-2222-2222-222222222221', 'fb222222-2222-2222-2222-222222222222', '100mg bar', 0, 3000, 150, true),
  ('ffffffff-bbbb-2222-2222-222222222222', 'fb222222-2222-2222-2222-222222222222', '200mg bar', 0, 5500, 100, true),
  ('ffffffff-bbbb-3333-3333-333333333333', 'fb333333-3333-3333-3333-333333333333', '100mg package (20x5mg)', 0, 2800, 180, true),
  ('ffffffff-bbbb-4444-4444-444444444444', 'fb444444-4444-4444-4444-444444444444', '50mg pack (5x10mg)', 0, 2000, 120, true),
  ('ffffffff-bbbb-5555-5555-555555555551', 'fb555555-5555-5555-5555-555555555555', '10mg packet', 0, 800, 300, true),
  ('ffffffff-bbbb-5555-5555-555555555552', 'fb555555-5555-5555-5555-555555555555', '4-pack (40mg total)', 0, 2800, 150, true),
  ('ffffffff-bbbb-6666-6666-666666666666', 'fb666666-6666-6666-6666-666666666666', '100mg package (20x5mg)', 0, 2600, 160, true),
  
  -- Wellness/Topical variants
  ('ffffffff-cccc-1111-1111-111111111111', 'fc111111-1111-1111-1111-111111111111', '30ml bottle (1000mg CBD)', 0, 6500, 50, true),
  ('ffffffff-cccc-1111-1111-111111111112', 'fc111111-1111-1111-1111-111111111111', '15ml bottle (500mg CBD)', 0, 3500, 75, true),
  ('ffffffff-cccc-2222-2222-222222222221', 'fc222222-2222-2222-2222-222222222222', '2oz jar', 0, 4500, 75, true),
  ('ffffffff-cccc-2222-2222-222222222222', 'fc222222-2222-2222-2222-222222222222', '4oz jar', 0, 8000, 40, true),
  ('ffffffff-cccc-3333-3333-333333333333', 'fc333333-3333-3333-3333-333333333333', '30 capsules', 0, 5500, 60, true),
  ('ffffffff-cccc-4444-4444-444444444444', 'fc444444-4444-4444-4444-444444444444', '30ml bottle', 0, 7500, 35, true),
  ('ffffffff-cccc-5555-5555-555555555555', 'fc555555-5555-5555-5555-555555555555', '8oz container', 0, 3500, 90, true),
  ('ffffffff-cccc-6666-6666-666666666666', 'fc666666-6666-6666-6666-666666666666', '60 capsules', 0, 4800, 80, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  weight_grams = EXCLUDED.weight_grams,
  price = EXCLUDED.price,
  inventory_count = EXCLUDED.inventory_count,
  is_active = EXCLUDED.is_active; 