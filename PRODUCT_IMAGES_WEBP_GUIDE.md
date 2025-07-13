# Product Images WebP System Guide

## Overview

The DankDeals product image system has been refactored to use modern WebP images with performance optimizations and responsive loading techniques.

## Features

### 1. **WebP Format**
- All product images converted to WebP format
- Significantly smaller file sizes (50-80% reduction)
- Better compression without quality loss
- Native browser support with JPEG fallbacks

### 2. **Responsive Image Component**
- Custom `ResponsiveImage` component with:
  - Lazy loading with Intersection Observer
  - Progressive loading states
  - Error handling with fallbacks
  - WebP with JPEG fallback support
  - Responsive sizing with `srcset` and `sizes`

### 3. **Centralized Image Mapping**
- `src/lib/productImages.ts` manages all product images
- Maps product IDs to their WebP images
- Fallback logic for product name matching
- Category-based fallback images

## File Structure

```
public/assets/products/
├── pineapple-fruz/
│   ├── pineapple-fruz-1.webp
│   ├── pineapple-fruz-2.webp
│   └── pineapple-fruz-3.webp
├── rs11/
│   ├── rainbow-sherbert11-1.webp
│   └── rainbow-sherbert11-2.webp
├── runtz/
│   ├── runtz-1.webp
│   ├── runtz-2.webp
│   └── runtz-3.webp
└── wedding-cake/
    ├── wedding-cake-1.webp
    ├── wedding-cake-2.webp
    └── wedding-cake-3.webp
```

## Product ID Mapping

| Product | ID | Name Pattern |
|---------|-----|--------------|
| Pineapple Fruz | 11111111-1111-1111-1111-111111111111 | Contains "pineapple" and "fruz" |
| Rainbow Sherbert #11 | 22222222-2222-2222-2222-222222222222 | Contains "rainbow", "sherbert", or "rs11" |
| Runtz | 33333333-3333-3333-3333-333333333333 | Contains "runtz" |
| Wedding Cake | 44444444-4444-4444-4444-444444444444 | Contains "wedding" and "cake" |

## Usage

### In Product Cards
```typescript
import { ResponsiveImage } from '@/components/ResponsiveImage';
import { getProductImages, getImageSizes } from '@/lib/productImages';

const productImages = getProductImages(productId, productName, category);

<ResponsiveImage
  src={productImages.main}
  fallbackSrc={product.image_url}
  alt={`${productName} - ${category} cannabis product`}
  aspectRatio="1/1"
  objectFit="cover"
  loading="lazy"
  sizes={getImageSizes('card')}
/>
```

### In Product Detail Pages
```typescript
const productImages = getProductImages(product.id, product.name, product.category);
const galleryImages = productImages.gallery;

// Use gallery images for slideshow
galleryImages.map((image, index) => (
  <ResponsiveImage
    key={index}
    src={image}
    alt={`${product.name} image ${index + 1}`}
    aspectRatio="4/3"
    priority={index === 0}
    sizes={getImageSizes('detail')}
  />
))
```

## Performance Benefits

1. **Reduced Load Times**
   - WebP images are 50-80% smaller than JPEG
   - Lazy loading prevents loading off-screen images
   - Responsive sizes prevent oversized downloads

2. **Better User Experience**
   - Smooth loading animations
   - Fallback states for errors
   - Progressive enhancement

3. **SEO Improvements**
   - Faster page loads improve Core Web Vitals
   - Proper alt text and semantic markup
   - Structured data support

## Database Updates

Run the following SQL script to update existing products:
```sql
-- Run scripts/update-product-images-to-webp.sql
```

## Adding New Products

When adding new products:

1. **Prepare Images**
   - Convert to WebP format
   - Create 3-4 images per product
   - Optimize file sizes (target < 200KB each)

2. **Upload to Public Directory**
   - Create folder: `public/assets/products/[product-slug]/`
   - Name consistently: `[product-slug]-1.webp`, etc.

3. **Update Image Mapping**
   - Add to `productImageMap` in `src/lib/productImages.ts`
   - Include product ID, image paths, and alt text

4. **Update Database**
   - Set `image_url` to main image path
   - Set `gallery_urls` array with all image paths

## Troubleshooting

### Images Not Loading
1. Check browser console for 404 errors
2. Verify files exist in `public/assets/products/`
3. Check product ID mapping in `productImages.ts`

### Fallback Images Showing
1. Product ID might not match mapping
2. Try matching by product name
3. Check category fallback configuration

### Performance Issues
1. Ensure images are properly optimized
2. Check lazy loading is working
3. Verify responsive sizes are appropriate 