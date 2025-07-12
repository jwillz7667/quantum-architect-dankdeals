-- scripts/fix-product-image-urls.sql
-- Fix product image URLs to point to public directory instead of src directory

-- Update main image URLs
UPDATE products 
SET image_url = REPLACE(image_url, '/src/assets/products/', '/assets/products/')
WHERE image_url LIKE '/src/assets/products/%';

-- Update gallery URLs for Pineapple Fruz
UPDATE products 
SET gallery_urls = ARRAY[
  '/assets/products/pineapple-fruz/pineapple-fruz-1.jpeg',
  '/assets/products/pineapple-fruz/pineapple-fruz-2.jpeg',
  '/assets/products/pineapple-fruz/pineapple-fruz-3.jpeg'
]
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Update gallery URLs for Rainbow Sherbert #11
UPDATE products 
SET gallery_urls = ARRAY[
  '/assets/products/rs11/rainbow-sherbert11-1.jpeg',
  '/assets/products/rs11/rainbow-sherbert11-2.jpeg'
]
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Update gallery URLs for Runtz
UPDATE products 
SET gallery_urls = ARRAY[
  '/assets/products/runtz/runtz-1.jpeg',
  '/assets/products/runtz/runtz-2.jpeg',
  '/assets/products/runtz/runtz-3.jpeg'
]
WHERE id = '33333333-3333-3333-3333-333333333333';

-- Update gallery URLs for Wedding Cake
UPDATE products 
SET gallery_urls = ARRAY[
  '/assets/products/wedding-cake/wedding-cake-1.jpeg',
  '/assets/products/wedding-cake/wedding-cake-2.jpeg',
  '/assets/products/wedding-cake/wedding-cake-3.jpeg'
]
WHERE id = '44444444-4444-4444-4444-444444444444';

-- Verify the updates
SELECT id, name, image_url, gallery_urls 
FROM products 
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
); 