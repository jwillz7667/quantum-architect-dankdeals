-- supabase/seed-products.sql
-- Seed data for cannabis products

-- Insert vendors
INSERT INTO vendors (id, name, email, phone, status) VALUES
  ('v1', 'Green Valley Farms', 'contact@greenvalley.com', '612-555-0101', 'active'),
  ('v2', 'Urban Gardens MN', 'info@urbangardens.com', '651-555-0102', 'active'),
  ('v3', 'Northern Lights Cannabis', 'hello@northernlights.com', '763-555-0103', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert products
INSERT INTO products (id, name, description, category, image_url, thc_content, cbd_content, vendor_id, is_active) VALUES
  -- Flower products
  ('p1', 'Blue Dream', 'A classic sativa-dominant hybrid with sweet berry aroma. Known for balanced cerebral invigoration and full-body relaxation.', 'flower', '/api/placeholder/400/400', 18.5, 0.5, 'v1', true),
  ('p2', 'OG Kush', 'Premium indica with complex aroma featuring notes of fuel, skunk, and spice. Perfect for evening relaxation.', 'flower', '/api/placeholder/400/400', 22.0, 0.2, 'v1', true),
  ('p3', 'Girl Scout Cookies', 'Popular hybrid strain with sweet and earthy flavors. Delivers euphoric effects followed by waves of full-body relaxation.', 'flower', '/api/placeholder/400/400', 20.0, 0.3, 'v2', true),
  ('p4', 'Sour Diesel', 'Energizing sativa with pungent diesel-like aroma. Fast-acting strain perfect for daytime use.', 'flower', '/api/placeholder/400/400', 19.0, 0.1, 'v2', true),
  ('p5', 'Purple Haze', 'Classic sativa strain with sweet and earthy flavors. Known for creative and euphoric effects.', 'flower', '/api/placeholder/400/400', 17.5, 0.4, 'v3', true),
  
  -- Pre-rolls
  ('p6', 'Sunset Sherbet Pre-Roll Pack', 'Pack of 5 premium pre-rolls featuring Sunset Sherbet strain. Each pre-roll contains 0.5g of flower.', 'prerolls', '/api/placeholder/400/400', 18.0, 0.3, 'v1', true),
  ('p7', 'Jack Herer Pre-Roll', 'Single 1g pre-roll of the legendary Jack Herer strain. Perfect for creative inspiration.', 'prerolls', '/api/placeholder/400/400', 21.0, 0.2, 'v2', true),
  ('p8', 'Mixed Variety Pre-Roll Pack', 'Variety pack with 3 different strains. Great for trying new favorites.', 'prerolls', '/api/placeholder/400/400', 19.0, 0.5, 'v3', true),
  
  -- Edibles
  ('p9', 'Blueberry Gummies', 'Delicious blueberry-flavored gummies. Each package contains 10 gummies with 10mg THC each.', 'edibles', '/api/placeholder/400/400', null, null, 'v1', true),
  ('p10', 'Dark Chocolate Bar', 'Premium dark chocolate infused with cannabis. 100mg total THC divided into 10 pieces.', 'edibles', '/api/placeholder/400/400', null, null, 'v2', true),
  ('p11', 'Tropical Fruit Chews', 'Assorted tropical fruit flavors. 20 chews per package, 5mg THC each.', 'edibles', '/api/placeholder/400/400', null, null, 'v3', true),
  ('p12', 'Honey Sticks', 'Natural honey infused with cannabis extract. Pack of 5 sticks, 10mg THC each.', 'edibles', '/api/placeholder/400/400', null, null, 'v1', true),
  
  -- Wellness
  ('p13', 'CBD Tincture 1000mg', 'High-quality full-spectrum CBD oil. Perfect for daily wellness routine.', 'wellness', '/api/placeholder/400/400', 0.3, 33.3, 'v2', true),
  ('p14', 'Pain Relief Balm', 'Topical balm with CBD and cooling menthol. Great for muscle and joint relief.', 'wellness', '/api/placeholder/400/400', 0.0, 5.0, 'v3', true),
  ('p15', 'Sleep Aid Capsules', 'CBD capsules with melatonin for better sleep. 30 capsules per bottle.', 'wellness', '/api/placeholder/400/400', 0.0, 25.0, 'v1', true)
ON CONFLICT (id) DO NOTHING;

-- Insert product variants
INSERT INTO product_variants (id, product_id, name, weight_grams, price, inventory_count, is_active) VALUES
  -- Blue Dream variants
  ('pv1', 'p1', '1/8 oz (3.5g)', 3.5, 4500, 50, true),
  ('pv2', 'p1', '1/4 oz (7g)', 7.0, 8500, 30, true),
  ('pv3', 'p1', '1/2 oz (14g)', 14.0, 16000, 20, true),
  ('pv4', 'p1', '1 oz (28g)', 28.0, 30000, 10, true),
  
  -- OG Kush variants
  ('pv5', 'p2', '1/8 oz (3.5g)', 3.5, 5000, 40, true),
  ('pv6', 'p2', '1/4 oz (7g)', 7.0, 9500, 25, true),
  ('pv7', 'p2', '1/2 oz (14g)', 14.0, 18000, 15, true),
  
  -- Girl Scout Cookies variants
  ('pv8', 'p3', '1/8 oz (3.5g)', 3.5, 4800, 45, true),
  ('pv9', 'p3', '1/4 oz (7g)', 7.0, 9000, 28, true),
  
  -- Sour Diesel variants
  ('pv10', 'p4', '1/8 oz (3.5g)', 3.5, 4600, 55, true),
  ('pv11', 'p4', '1/4 oz (7g)', 7.0, 8800, 35, true),
  
  -- Purple Haze variants
  ('pv12', 'p5', '1/8 oz (3.5g)', 3.5, 4200, 60, true),
  ('pv13', 'p5', '1/4 oz (7g)', 7.0, 8000, 40, true),
  
  -- Pre-roll variants
  ('pv14', 'p6', '5-pack (2.5g total)', 2.5, 3500, 100, true),
  ('pv15', 'p7', 'Single 1g', 1.0, 1200, 150, true),
  ('pv16', 'p8', '3-pack variety', 1.5, 2500, 80, true),
  
  -- Edible variants
  ('pv17', 'p9', '100mg package', 0, 2500, 200, true),
  ('pv18', 'p10', '100mg bar', 0, 3000, 150, true),
  ('pv19', 'p11', '100mg package', 0, 2800, 180, true),
  ('pv20', 'p12', '50mg pack', 0, 2000, 120, true),
  
  -- Wellness variants
  ('pv21', 'p13', '30ml bottle', 0, 6500, 50, true),
  ('pv22', 'p14', '2oz jar', 0, 4500, 75, true),
  ('pv23', 'p15', '30 capsules', 0, 5500, 60, true)
ON CONFLICT (id) DO NOTHING; 