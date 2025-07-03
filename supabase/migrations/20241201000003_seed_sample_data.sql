-- Insert sample categories
INSERT INTO categories (name, slug, description, sort_order, is_active) VALUES
('Flower', 'flower', 'Premium cannabis flower strains', 1, true),
('Pre-Rolls', 'pre-rolls', 'Ready-to-smoke joints and blunts', 2, true),
('Edibles', 'edibles', 'Cannabis-infused food products', 3, true),
('Concentrates', 'concentrates', 'High-potency cannabis extracts', 4, true),
('Vapes', 'vapes', 'Vaporizer cartridges and disposables', 5, true),
('Topicals', 'topicals', 'Cannabis-infused creams and balms', 6, true),
('Accessories', 'accessories', 'Smoking and vaping accessories', 7, true);

-- Insert sample products
INSERT INTO products (
  name, slug, description, category_id, price, thc_percentage, cbd_percentage, 
  strain_type, effects, flavors, stock_quantity, is_featured, is_active, 
  weight_grams, lab_tested
) VALUES
-- Flower Products
(
  'Blue Dream', 'blue-dream-flower', 
  'A classic sativa-dominant hybrid known for its balanced effects and sweet berry aroma.',
  (SELECT id FROM categories WHERE slug = 'flower'),
  45.00, 22.5, 0.8, 'hybrid',
  ARRAY['euphoric', 'creative', 'uplifting', 'relaxed'],
  ARRAY['berry', 'sweet', 'earthy'],
  25, true, true, 3.5, true
),
(
  'OG Kush', 'og-kush-flower',
  'An indica-dominant strain with a distinctive pine and lemon aroma.',
  (SELECT id FROM categories WHERE slug = 'flower'),
  50.00, 24.0, 0.5, 'indica',
  ARRAY['relaxed', 'sleepy', 'happy', 'euphoric'],
  ARRAY['pine', 'lemon', 'earthy'],
  30, true, true, 3.5, true
),
(
  'Sour Diesel', 'sour-diesel-flower',
  'A fast-acting sativa strain known for its energizing effects.',
  (SELECT id FROM categories WHERE slug = 'flower'),
  48.00, 20.0, 0.3, 'sativa',
  ARRAY['energetic', 'uplifting', 'creative', 'focused'],
  ARRAY['diesel', 'citrus', 'pungent'],
  20, false, true, 3.5, true
),
(
  'Granddaddy Purple', 'granddaddy-purple-flower',
  'A potent indica strain with grape and berry flavors.',
  (SELECT id FROM categories WHERE slug = 'flower'),
  52.00, 23.0, 0.7, 'indica',
  ARRAY['relaxed', 'sleepy', 'happy', 'euphoric'],
  ARRAY['grape', 'berry', 'sweet'],
  15, true, true, 3.5, true
),

-- Pre-Roll Products
(
  'Blue Dream Pre-Roll', 'blue-dream-pre-roll',
  'Pre-rolled Blue Dream joints, perfect for on-the-go consumption.',
  (SELECT id FROM categories WHERE slug = 'pre-rolls'),
  12.00, 22.5, 0.8, 'hybrid',
  ARRAY['euphoric', 'creative', 'uplifting', 'relaxed'],
  ARRAY['berry', 'sweet', 'earthy'],
  50, true, true, 1.0, true
),
(
  'OG Kush Pre-Roll', 'og-kush-pre-roll',
  'Premium OG Kush pre-rolls for relaxation.',
  (SELECT id FROM categories WHERE slug = 'pre-rolls'),
  14.00, 24.0, 0.5, 'indica',
  ARRAY['relaxed', 'sleepy', 'happy', 'euphoric'],
  ARRAY['pine', 'lemon', 'earthy'],
  40, false, true, 1.0, true
),

-- Edible Products
(
  'Strawberry Gummies', 'strawberry-gummies',
  'Delicious strawberry-flavored gummies with 10mg THC each.',
  (SELECT id FROM categories WHERE slug = 'edibles'),
  25.00, 0.0, 0.0, NULL,
  ARRAY['relaxed', 'happy', 'sleepy'],
  ARRAY['strawberry', 'sweet', 'fruity'],
  60, true, true, 0.0, true
),
(
  'Chocolate Chip Cookies', 'chocolate-chip-cookies',
  'Classic chocolate chip cookies infused with 25mg THC each.',
  (SELECT id FROM categories WHERE slug = 'edibles'),
  18.00, 0.0, 0.0, NULL,
  ARRAY['relaxed', 'happy', 'euphoric'],
  ARRAY['chocolate', 'sweet', 'vanilla'],
  35, true, true, 0.0, true
),
(
  'Mango Fruit Chews', 'mango-fruit-chews',
  'Tropical mango chews with 5mg THC each, perfect for microdosing.',
  (SELECT id FROM categories WHERE slug = 'edibles'),
  22.00, 0.0, 0.0, NULL,
  ARRAY['uplifting', 'happy', 'creative'],
  ARRAY['mango', 'tropical', 'sweet'],
  45, false, true, 0.0, true
),

-- Concentrate Products
(
  'Live Resin - Blue Dream', 'live-resin-blue-dream',
  'High-quality live resin extract with intense flavor and potency.',
  (SELECT id FROM categories WHERE slug = 'concentrates'),
  60.00, 75.0, 2.0, 'hybrid',
  ARRAY['euphoric', 'creative', 'uplifting', 'relaxed'],
  ARRAY['berry', 'sweet', 'earthy'],
  12, true, true, 1.0, true
),
(
  'Shatter - OG Kush', 'shatter-og-kush',
  'Crystal-clear shatter with classic OG Kush flavor profile.',
  (SELECT id FROM categories WHERE slug = 'concentrates'),
  55.00, 82.0, 1.0, 'indica',
  ARRAY['relaxed', 'sleepy', 'happy', 'euphoric'],
  ARRAY['pine', 'lemon', 'earthy'],
  8, false, true, 1.0, true
),

-- Vape Products
(
  'Blue Dream Vape Cart', 'blue-dream-vape-cart',
  'Premium 510-thread cartridge filled with Blue Dream distillate.',
  (SELECT id FROM categories WHERE slug = 'vapes'),
  42.00, 85.0, 1.5, 'hybrid',
  ARRAY['euphoric', 'creative', 'uplifting', 'relaxed'],
  ARRAY['berry', 'sweet', 'earthy'],
  25, true, true, 0.5, true
),
(
  'Sour Diesel Disposable', 'sour-diesel-disposable',
  'Convenient disposable vape pen with Sour Diesel strain.',
  (SELECT id FROM categories WHERE slug = 'vapes'),
  35.00, 80.0, 1.0, 'sativa',
  ARRAY['energetic', 'uplifting', 'creative', 'focused'],
  ARRAY['diesel', 'citrus', 'pungent'],
  30, true, true, 0.3, true
),

-- Topical Products
(
  'CBD Pain Relief Cream', 'cbd-pain-relief-cream',
  'Soothing topical cream with high CBD content for pain relief.',
  (SELECT id FROM categories WHERE slug = 'topicals'),
  35.00, 0.0, 15.0, NULL,
  ARRAY['relaxed', 'pain relief', 'anti-inflammatory'],
  ARRAY['menthol', 'eucalyptus', 'herbal'],
  20, false, true, 0.0, true
),
(
  'THC Massage Oil', 'thc-massage-oil',
  'Luxurious massage oil infused with THC for relaxation.',
  (SELECT id FROM categories WHERE slug = 'topicals'),
  28.00, 5.0, 10.0, NULL,
  ARRAY['relaxed', 'pain relief', 'euphoric'],
  ARRAY['lavender', 'coconut', 'vanilla'],
  15, true, true, 0.0, true
),

-- Accessory Products
(
  'Glass Bong - 12 inch', 'glass-bong-12-inch',
  'High-quality borosilicate glass bong with ice catcher.',
  (SELECT id FROM categories WHERE slug = 'accessories'),
  85.00, 0.0, 0.0, NULL,
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  10, false, true, 0.0, false
),
(
  'Rolling Papers - King Size', 'rolling-papers-king-size',
  'Premium slow-burning rolling papers for the perfect joint.',
  (SELECT id FROM categories WHERE slug = 'accessories'),
  8.00, 0.0, 0.0, NULL,
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  100, false, true, 0.0, false
),
(
  'Grinder - 4 Piece', 'grinder-4-piece',
  'Premium aluminum grinder with pollen catcher.',
  (SELECT id FROM categories WHERE slug = 'accessories'),
  25.00, 0.0, 0.0, NULL,
  ARRAY[]::TEXT[],
  ARRAY[]::TEXT[],
  25, true, true, 0.0, false
);

-- Update product slugs to ensure uniqueness
UPDATE products SET slug = slug || '-' || EXTRACT(EPOCH FROM NOW())::TEXT WHERE slug IN (
  SELECT slug FROM products GROUP BY slug HAVING COUNT(*) > 1
); 