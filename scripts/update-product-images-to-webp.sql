-- scripts/update-product-images-to-webp.sql
-- Update product images to use WebP format for better performance

-- Pineapple Fruz
UPDATE products 
SET 
  image_url = '/assets/products/pineapple-fruz/pineapple-fruz-1.webp',
  gallery_urls = ARRAY[
    '/assets/products/pineapple-fruz/pineapple-fruz-1.webp',
    '/assets/products/pineapple-fruz/pineapple-fruz-2.webp',
    '/assets/products/pineapple-fruz/pineapple-fruz-3.webp'
  ]
WHERE id = '11111111-1111-1111-1111-111111111111' 
   OR LOWER(name) LIKE '%pineapple%fruz%';

-- Rainbow Sherbert #11 (RS11)
UPDATE products 
SET 
  image_url = '/assets/products/rs11/rainbow-sherbert11-1.webp',
  gallery_urls = ARRAY[
    '/assets/products/rs11/rainbow-sherbert11-1.webp',
    '/assets/products/rs11/rainbow-sherbert11-2.webp'
  ]
WHERE id = '22222222-2222-2222-2222-222222222222'
   OR LOWER(name) LIKE '%rainbow%sherbert%'
   OR LOWER(name) LIKE '%rs11%';

-- Runtz
UPDATE products 
SET 
  image_url = '/assets/products/runtz/runtz-1.webp',
  gallery_urls = ARRAY[
    '/assets/products/runtz/runtz-1.webp',
    '/assets/products/runtz/runtz-2.webp',
    '/assets/products/runtz/runtz-3.webp'
  ]
WHERE id = '33333333-3333-3333-3333-333333333333'
   OR LOWER(name) LIKE '%runtz%';

-- Wedding Cake
UPDATE products 
SET 
  image_url = '/assets/products/wedding-cake/wedding-cake-1.webp',
  gallery_urls = ARRAY[
    '/assets/products/wedding-cake/wedding-cake-1.webp',
    '/assets/products/wedding-cake/wedding-cake-2.webp',
    '/assets/products/wedding-cake/wedding-cake-3.webp'
  ]
WHERE id = '44444444-4444-4444-4444-444444444444'
   OR LOWER(name) LIKE '%wedding%cake%';

-- Update any remaining JPEG references to WebP
UPDATE products 
SET 
  image_url = REPLACE(REPLACE(image_url, '.jpeg', '.webp'), '.jpg', '.webp')
WHERE image_url LIKE '%.jpeg' OR image_url LIKE '%.jpg';

-- Verify the updates
SELECT id, name, image_url, gallery_urls 
FROM products 
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
)
ORDER BY name; 