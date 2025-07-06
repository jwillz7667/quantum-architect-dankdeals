-- Seed E-commerce Data
-- Insert sample categories and products for testing

-- Insert categories
INSERT INTO public.categories (name, slug, description, image_url, sort_order, is_active) VALUES
  ('Flower', 'flower', 'Premium cannabis flower, hand-selected and lab-tested', '/images/categories/flower.jpg', 1, true),
  ('Edibles', 'edibles', 'Delicious THC-infused treats and beverages', '/images/categories/edibles.jpg', 2, true),
  ('Pre-Rolls', 'pre-rolls', 'Perfectly rolled joints ready to enjoy', '/images/categories/prerolls.jpg', 3, true),
  ('Concentrates', 'concentrates', 'Potent extracts and concentrates', '/images/categories/concentrates.jpg', 4, true),
  ('Topicals', 'topicals', 'Cannabis-infused creams and balms', '/images/categories/topicals.jpg', 5, true),
  ('Accessories', 'accessories', 'Everything you need for the perfect session', '/images/categories/accessories.jpg', 6, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
WITH flower_category AS (
  SELECT id FROM public.categories WHERE slug = 'flower'
),
edibles_category AS (
  SELECT id FROM public.categories WHERE slug = 'edibles'
),
prerolls_category AS (
  SELECT id FROM public.categories WHERE slug = 'pre-rolls'
)
INSERT INTO public.products (
  name, slug, description, category_id, price, 
  thc_percentage, cbd_percentage, strain_type, 
  effects, flavors, image_url, stock_quantity, 
  is_featured, is_active, weight_grams, lab_tested
) VALUES
  -- Flower products
  (
    'Blue Dream', 
    'blue-dream-flower', 
    'A legendary sativa-dominant hybrid with sweet berry aroma and balanced effects. Perfect for daytime creativity.',
    (SELECT id FROM flower_category),
    35.00,
    22.5,
    0.5,
    'hybrid',
    ARRAY['euphoric', 'creative', 'uplifted', 'relaxed'],
    ARRAY['blueberry', 'sweet', 'herbal'],
    '/images/products/blue-dream.jpg',
    50,
    true,
    true,
    3.5,
    true
  ),
  (
    'OG Kush',
    'og-kush-flower',
    'Classic indica with earthy pine aroma and strong relaxation effects. Great for evening use.',
    (SELECT id FROM flower_category),
    40.00,
    24.0,
    0.1,
    'indica',
    ARRAY['relaxed', 'sleepy', 'happy', 'hungry'],
    ARRAY['pine', 'woody', 'earthy'],
    '/images/products/og-kush.jpg',
    30,
    true,
    true,
    3.5,
    true
  ),
  (
    'Sour Diesel',
    'sour-diesel-flower',
    'Energizing sativa with pungent diesel aroma. Perfect for creative activities and social gatherings.',
    (SELECT id FROM flower_category),
    38.00,
    23.0,
    0.2,
    'sativa',
    ARRAY['energetic', 'uplifted', 'creative', 'focused'],
    ARRAY['diesel', 'citrus', 'pungent'],
    '/images/products/sour-diesel.jpg',
    40,
    false,
    true,
    3.5,
    true
  ),
  
  -- Edibles products
  (
    'Chocolate Chip Cookies',
    'chocolate-chip-cookies-10mg',
    'Delicious homemade chocolate chip cookies infused with 10mg THC each. Pack of 10.',
    (SELECT id FROM edibles_category),
    25.00,
    NULL,
    NULL,
    NULL,
    ARRAY['relaxed', 'happy', 'euphoric'],
    ARRAY['chocolate', 'sweet', 'vanilla'],
    '/images/products/chocolate-cookies.jpg',
    100,
    true,
    true,
    100,
    true
  ),
  (
    'Gummy Bears',
    'gummy-bears-mixed-fruit',
    'Assorted fruit flavored gummy bears. 5mg THC each, 20 pieces per package.',
    (SELECT id FROM edibles_category),
    20.00,
    NULL,
    NULL,
    NULL,
    ARRAY['uplifted', 'relaxed', 'happy'],
    ARRAY['fruit', 'sweet', 'tropical'],
    '/images/products/gummy-bears.jpg',
    75,
    false,
    true,
    50,
    true
  ),
  
  -- Pre-rolls
  (
    'Blue Dream Pre-Roll',
    'blue-dream-preroll-1g',
    'Premium Blue Dream flower rolled in organic hemp paper. 1g joint.',
    (SELECT id FROM prerolls_category),
    12.00,
    22.5,
    0.5,
    'hybrid',
    ARRAY['euphoric', 'creative', 'uplifted'],
    ARRAY['blueberry', 'sweet', 'herbal'],
    '/images/products/blue-dream-preroll.jpg',
    60,
    false,
    true,
    1,
    true
  ),
  (
    'Indica Blend Pre-Roll Pack',
    'indica-blend-preroll-5pack',
    'Pack of 5 premium indica pre-rolls. Perfect for relaxation. 0.5g each.',
    (SELECT id FROM prerolls_category),
    30.00,
    21.0,
    0.3,
    'indica',
    ARRAY['relaxed', 'sleepy', 'calm'],
    ARRAY['earthy', 'pine', 'woody'],
    '/images/products/indica-preroll-pack.jpg',
    25,
    true,
    true,
    2.5,
    true
  )
ON CONFLICT (slug) DO NOTHING;
