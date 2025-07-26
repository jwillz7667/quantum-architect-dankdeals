-- Restore production data to local development

-- Insert products
INSERT INTO public.products (id, name, description, category, thc_content, cbd_content, strain_type, effects, flavors, image_url, images, is_featured, is_active, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Pineapple Fruz', 'Experience tropical paradise with Pineapple Fruz, a premium hybrid strain that delivers an explosion of sweet pineapple flavors with subtle fruity undertones. This carefully cultivated flower offers a perfect balance of uplifting cerebral effects and gentle body relaxation. Known for its dense, trichrome-covered buds and vibrant orange hairs, Pineapple Fruz is ideal for creative activities, social gatherings, or simply unwinding after a long day. Lab-tested for purity and potency.', 'flower', 23.50, 0.80, 'hybrid', ARRAY['euphoric','creative','relaxed','happy','uplifted'], ARRAY['pineapple','tropical','sweet','citrus','fruity'], '/assets/products/pineapple-fruz/pineapple-fruz-1.webp', '["/assets/products/pineapple-fruz/pineapple-fruz-1.webp","/assets/products/pineapple-fruz/pineapple-fruz-2.webp","/assets/products/pineapple-fruz/pineapple-fruz-3.webp"]'::jsonb, true, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-13T18:17:21.702893+00:00'),

('22222222-2222-2222-2222-222222222222', 'Rainbow Sherbert #11', 'Rainbow Sherbert #11, also known as RS11, is an exclusive phenotype that combines the best traits of its legendary lineage. This indica-dominant hybrid boasts a complex terpene profile featuring sweet, creamy sherbert notes with hints of fruit and gas. The effects are equally impressive, offering deep relaxation without heavy sedation, making it perfect for evening use. With its stunning purple and green coloration covered in a thick layer of crystalline trichomes, RS11 is a true connoisseur''s choice. Premium indoor-grown and hand-trimmed.', 'flower', 26.20, 0.50, 'indica', ARRAY['relaxed','euphoric','sleepy','happy','hungry'], ARRAY['sweet','berry','creamy','fruity','gas'], '/assets/products/rs11/rainbow-sherbert11-1.webp', '["/assets/products/rs11/rainbow-sherbert11-1.webp","/assets/products/rs11/rainbow-sherbert11-2.webp"]'::jsonb, true, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-13T18:17:21.937773+00:00'),

('33333333-3333-3333-3333-333333333333', 'Runtz', 'Indulge in the award-winning Runtz strain, a perfectly balanced hybrid that has taken the cannabis world by storm. This Zkittlez x Gelato cross delivers an incredibly smooth smoke with a sweet, fruity candy flavor that lives up to its name. Runtz produces euphoric and uplifting effects that gradually transition into full-body relaxation, making it versatile for any time of day. The beautiful purple and green buds are generously coated with resinous trichomes, indicating its premium quality and potency. Grown with meticulous care and attention to detail.', 'flower', 24.80, 0.60, 'hybrid', ARRAY['euphoric','uplifted','happy','relaxed','tingly'], ARRAY['sweet','fruity','candy','tropical','berry'], '/assets/products/runtz/runtz-1.webp', '["/assets/products/runtz/runtz-1.webp","/assets/products/runtz/runtz-2.webp","/assets/products/runtz/runtz-3.webp"]'::jsonb, true, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-13T18:17:22.063791+00:00'),

('44444444-4444-4444-4444-444444444444', 'Wedding Cake', 'Wedding Cake, also known as Pink Cookies, is a potent indica-hybrid that delivers exceptional flavor and effects. This Triangle Kush x Animal Mints cross features a rich, tangy flavor profile with undertones of vanilla and earth. Known for its relaxing and euphoric effects, Wedding Cake is perfect for unwinding in the evening or managing stress and discomfort. The dense, colorful buds showcase a thick coating of trichomes that give it a cake-like appearance. This premium strain is cultivated indoors under optimal conditions to ensure maximum potency and flavor.', 'flower', 25.50, 0.40, 'hybrid', ARRAY['relaxed','euphoric','happy','uplifted','hungry'], ARRAY['vanilla','sweet','earthy','pepper','flowery'], '/assets/products/wedding-cake/wedding-cake-1.webp', '["/assets/products/wedding-cake/wedding-cake-1.webp","/assets/products/wedding-cake/wedding-cake-2.webp","/assets/products/wedding-cake/wedding-cake-3.webp"]'::jsonb, true, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-13T18:17:22.197393+00:00')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  thc_content = EXCLUDED.thc_content,
  cbd_content = EXCLUDED.cbd_content,
  strain_type = EXCLUDED.strain_type,
  effects = EXCLUDED.effects,
  flavors = EXCLUDED.flavors,
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- Insert product variants
INSERT INTO public.product_variants (id, product_id, name, weight_grams, price, stock_quantity, is_active, created_at, updated_at) VALUES
-- Pineapple Fruz variants
('pv_pf_eighth', '11111111-1111-1111-1111-111111111111', '1/8 oz (3.5g)', 3.50, 40.00, 50, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-07T13:31:40.203452+00:00'),
('pv_pf_quarter', '11111111-1111-1111-1111-111111111111', '1/4 oz (7g)', 7.00, 75.00, 30, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-07T13:31:40.203452+00:00'),
('pv_pf_half', '11111111-1111-1111-1111-111111111111', '1/2 oz (14g)', 14.00, 140.00, 20, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-07T13:31:40.203452+00:00'),
('pv_pf_ounce', '11111111-1111-1111-1111-111111111111', '1 oz (28g)', 28.00, 250.00, 10, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-07T13:31:40.203452+00:00'),

-- Rainbow Sherbert #11 variants
('pv_rs_eighth', '22222222-2222-2222-2222-222222222222', '1/8 oz (3.5g)', 3.50, 40.00, 40, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-07T13:31:40.203452+00:00'),
('pv_rs_quarter', '22222222-2222-2222-2222-222222222222', '1/4 oz (7g)', 7.00, 75.00, 25, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-07T13:31:40.203452+00:00'),
('pv_rs_half', '22222222-2222-2222-2222-222222222222', '1/2 oz (14g)', 14.00, 140.00, 15, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-07T13:31:40.203452+00:00'),
('pv_rs_ounce', '22222222-2222-2222-2222-222222222222', '1 oz (28g)', 28.00, 250.00, 8, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-07T13:31:40.203452+00:00'),

-- Runtz variants
('pv_rz_eighth', '33333333-3333-3333-3333-333333333333', '1/8 oz (3.5g)', 3.50, 40.00, 45, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-07T13:31:40.203452+00:00'),
('pv_rz_quarter', '33333333-3333-3333-3333-333333333333', '1/4 oz (7g)', 7.00, 75.00, 28, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-07T13:31:40.203452+00:00'),
('pv_rz_half', '33333333-3333-3333-3333-333333333333', '1/2 oz (14g)', 14.00, 140.00, 18, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-07T13:31:40.203452+00:00'),
('pv_rz_ounce', '33333333-3333-3333-3333-333333333333', '1 oz (28g)', 28.00, 250.00, 10, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-07T13:31:40.203452+00:00'),

-- Wedding Cake variants
('pv_wc_eighth', '44444444-4444-4444-4444-444444444444', '1/8 oz (3.5g)', 3.50, 40.00, 55, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-07T13:31:40.203452+00:00'),
('pv_wc_quarter', '44444444-4444-4444-4444-444444444444', '1/4 oz (7g)', 7.00, 75.00, 35, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-07T13:31:40.203452+00:00'),
('pv_wc_half', '44444444-4444-4444-4444-444444444444', '1/2 oz (14g)', 14.00, 140.00, 22, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-07T13:31:40.203452+00:00'),
('pv_wc_ounce', '44444444-4444-4444-4444-444444444444', '1 oz (28g)', 28.00, 250.00, 12, true, '2025-07-07T13:31:40.203452+00:00', '2025-07-07T13:31:40.203452+00:00')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  weight_grams = EXCLUDED.weight_grams,
  price = EXCLUDED.price,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;