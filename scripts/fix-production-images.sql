-- Fix Product Images for Production
-- This script ensures all product images use the correct paths that work in production

-- First, check current image URLs
SELECT id, name, image_url, gallery_urls 
FROM products
ORDER BY created_at;

-- Update all products to use correct image paths
-- These should be served from the public directory

-- Pineapple Fruz
UPDATE products 
SET 
  image_url = '/assets/products/pineapple-fruz/pineapple-fruz-1.jpeg',
  gallery_urls = ARRAY[
    '/assets/products/pineapple-fruz/pineapple-fruz-1.jpeg',
    '/assets/products/pineapple-fruz/pineapple-fruz-2.jpeg',
    '/assets/products/pineapple-fruz/pineapple-fruz-3.jpeg'
  ]
WHERE LOWER(name) LIKE '%pineapple%';

-- Rainbow Sherbert #11
UPDATE products 
SET 
  image_url = '/assets/products/rs11/rainbow-sherbert11-1.jpeg',
  gallery_urls = ARRAY[
    '/assets/products/rs11/rainbow-sherbert11-1.jpeg',
    '/assets/products/rs11/rainbow-sherbert11-2.jpeg'
  ]
WHERE LOWER(name) LIKE '%rainbow%' OR LOWER(name) LIKE '%sherbert%';

-- Runtz
UPDATE products 
SET 
  image_url = '/assets/products/runtz/runtz-1.jpeg',
  gallery_urls = ARRAY[
    '/assets/products/runtz/runtz-1.jpeg',
    '/assets/products/runtz/runtz-2.jpeg',
    '/assets/products/runtz/runtz-3.jpeg'
  ]
WHERE LOWER(name) LIKE '%runtz%';

-- Wedding Cake
UPDATE products 
SET 
  image_url = '/assets/products/wedding-cake/wedding-cake-1.jpeg',
  gallery_urls = ARRAY[
    '/assets/products/wedding-cake/wedding-cake-1.jpeg',
    '/assets/products/wedding-cake/wedding-cake-2.jpeg',
    '/assets/products/wedding-cake/wedding-cake-3.jpeg'
  ]
WHERE LOWER(name) LIKE '%wedding%cake%';

-- Fix any remaining products that might have src/assets paths
UPDATE products 
SET image_url = REPLACE(image_url, '/src/assets/', '/assets/')
WHERE image_url LIKE '/src/assets/%';

-- Fix any products that might have incorrect paths
UPDATE products 
SET image_url = REPLACE(image_url, 'src/assets/', '/assets/')
WHERE image_url LIKE 'src/assets/%';

-- Ensure no products have null image URLs (set a default if needed)
UPDATE products 
SET image_url = '/assets/products/flower-default.jpg'
WHERE image_url IS NULL OR image_url = '';

-- Verify all updates
SELECT 
  id, 
  name, 
  image_url,
  CASE 
    WHEN image_url LIKE '/assets/%' THEN '✅ Correct'
    WHEN image_url IS NULL THEN '❌ NULL'
    ELSE '⚠️ Check path'
  END as status,
  gallery_urls
FROM products
ORDER BY created_at;

-- Summary of image paths
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN image_url LIKE '/assets/%' THEN 1 END) as correct_paths,
  COUNT(CASE WHEN image_url NOT LIKE '/assets/%' OR image_url IS NULL THEN 1 END) as incorrect_paths
FROM products; 