# Product Images Fix - Production Guide

## Issue Summary

Product images were not loading in production due to:
1. Components importing images from `src/assets/` which get bundled differently in production
2. Database URLs pointing to `/assets/products/...` expecting static files
3. OptimizedImage component trying to load non-existent `.webp` versions

## Fixes Applied

### 1. Removed Local Image Imports
- **Files Updated**: 
  - `src/components/ProductCard.tsx`
  - `src/pages/ProductDetail.tsx`
  
- **Changes**: Removed all local image imports and mappings
- **Result**: Components now use URLs directly from the database

### 2. Fixed Price Display
- **File**: `src/components/ProductGrid.tsx`
- **Issue**: Prices are stored in cents in the database
- **Fix**: Added division by 100 to convert cents to dollars

### 3. Removed WebP Optimization
- **File**: `src/components/OptimizedImage.tsx`
- **Issue**: Component was trying to load `.webp` versions that don't exist
- **Fix**: Removed the `<picture>` element and webp source

## Production Deployment Checklist

### 1. Verify Images in Public Directory
```bash
# Check that all product images exist
ls -la public/assets/products/
```

Expected structure:
```
public/assets/products/
├── pineapple-fruz/
│   ├── pineapple-fruz-1.jpeg
│   ├── pineapple-fruz-2.jpeg
│   └── pineapple-fruz-3.jpeg
├── rs11/
│   ├── rainbow-sherbert11-1.jpeg
│   └── rainbow-sherbert11-2.jpeg
├── runtz/
│   ├── runtz-1.jpeg
│   ├── runtz-2.jpeg
│   └── runtz-3.jpeg
└── wedding-cake/
    ├── wedding-cake-1.jpeg
    ├── wedding-cake-2.jpeg
    └── wedding-cake-3.jpeg
```

### 2. Verify Database URLs
Run the verification script:
```bash
node scripts/verify-product-images.js
```

### 3. Build Configuration
Both Vercel and Netlify are configured correctly:
- **Vercel**: `vercel.json` has proper headers for `/assets/*`
- **Netlify**: Uses standard SPA configuration

### 4. CSP Headers
The Content Security Policy in `public/_headers` allows images from:
- `'self'` (same origin)
- `data:` (data URLs)
- `https:` (all HTTPS sources)
- `blob:` (blob URLs)

## Testing in Production

### 1. After Deployment
1. Clear browser cache
2. Visit product pages
3. Check browser console for 404 errors
4. Verify images load correctly

### 2. Debug Image Loading
If images still don't load:
```javascript
// In browser console
fetch('/assets/products/pineapple-fruz/pineapple-fruz-1.jpeg')
  .then(res => console.log('Status:', res.status))
  .catch(err => console.error('Error:', err));
```

### 3. Check Network Tab
1. Open DevTools Network tab
2. Filter by "Img"
3. Look for failed requests
4. Check response headers

## Common Issues & Solutions

### Issue: 404 on Image URLs
**Cause**: Images not included in build
**Solution**: Ensure images are in `public/` directory before building

### Issue: CORS Errors
**Cause**: Incorrect CSP headers
**Solution**: Already fixed in `public/_headers`

### Issue: Images Load in Dev but Not Prod
**Cause**: Import vs static file mismatch
**Solution**: Already fixed by using database URLs

### Issue: Slow Image Loading
**Cause**: Large image files
**Solution**: Consider image optimization:
```bash
# Install sharp-cli
npm install -g sharp-cli

# Optimize images
sharp -i public/assets/products/**/*.jpeg -o public/assets/products/ -- resize 1200 1200 --withoutEnlargement --jpeg.quality 85
```

## Future Improvements

1. **Add WebP Support**:
   - Generate `.webp` versions of all images
   - Update OptimizedImage component to use them

2. **Image CDN**:
   - Upload images to Cloudinary or similar
   - Update database URLs to use CDN

3. **Responsive Images**:
   - Generate multiple sizes
   - Use `srcset` for better performance

4. **Lazy Loading**:
   - Already implemented in OptimizedImage
   - Consider adding blur placeholders

## Verification Commands

```bash
# Build locally and test
npm run build
npm run preview

# Check build output
ls -la dist/assets/

# Verify no image imports in built JS
grep -r "pineapple-fruz" dist/*.js
```

## Summary

The production image loading issue has been resolved by:
1. ✅ Using database URLs directly (no imports)
2. ✅ Ensuring images are in public directory
3. ✅ Removing webp optimization (for now)
4. ✅ Fixing price display (cents to dollars)

Images should now load correctly in production! 