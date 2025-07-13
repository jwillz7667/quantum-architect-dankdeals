// src/lib/productImages.ts

// Product image configuration with fallbacks
interface ProductImageSet {
  main: string;
  gallery: string[];
  alt: string;
}

// Default placeholder
const PLACEHOLDER_IMAGE = '/assets/placeholder.svg';

// Product image mappings
export const productImageMap: Record<string, ProductImageSet> = {
  // Pineapple Fruz
  '11111111-1111-1111-1111-111111111111': {
    main: '/assets/products/pineapple-fruz/pineapple-fruz-1.webp',
    gallery: [
      '/assets/products/pineapple-fruz/pineapple-fruz-1.webp',
      '/assets/products/pineapple-fruz/pineapple-fruz-2.webp',
      '/assets/products/pineapple-fruz/pineapple-fruz-3.webp',
    ],
    alt: 'Pineapple Fruz Cannabis Strain',
  },

  // Rainbow Sherbert #11 (RS11)
  '22222222-2222-2222-2222-222222222222': {
    main: '/assets/products/rs11/rainbow-sherbert11-1.webp',
    gallery: [
      '/assets/products/rs11/rainbow-sherbert11-1.webp',
      '/assets/products/rs11/rainbow-sherbert11-2.webp',
    ],
    alt: 'Rainbow Sherbert #11 Cannabis Strain',
  },

  // Runtz
  '33333333-3333-3333-3333-333333333333': {
    main: '/assets/products/runtz/runtz-1.webp',
    gallery: [
      '/assets/products/runtz/runtz-1.webp',
      '/assets/products/runtz/runtz-2.webp',
      '/assets/products/runtz/runtz-3.webp',
    ],
    alt: 'Runtz Cannabis Strain',
  },

  // Wedding Cake
  '44444444-4444-4444-4444-444444444444': {
    main: '/assets/products/wedding-cake/wedding-cake-1.webp',
    gallery: [
      '/assets/products/wedding-cake/wedding-cake-1.webp',
      '/assets/products/wedding-cake/wedding-cake-2.webp',
      '/assets/products/wedding-cake/wedding-cake-3.webp',
    ],
    alt: 'Wedding Cake Cannabis Strain',
  },
};

// Get product images with fallback support
export function getProductImages(
  productId: string,
  productName?: string,
  _category?: string
): ProductImageSet {
  // First check if we have specific images for this product ID
  if (productImageMap[productId]) {
    return productImageMap[productId];
  }

  // Try to match by product name
  if (productName) {
    const nameLower = productName.toLowerCase();

    if (nameLower.includes('pineapple') && nameLower.includes('fruz')) {
      return productImageMap['11111111-1111-1111-1111-111111111111'];
    }
    if (
      nameLower.includes('rainbow') ||
      nameLower.includes('sherbert') ||
      nameLower.includes('rs11')
    ) {
      return productImageMap['22222222-2222-2222-2222-222222222222'];
    }
    if (nameLower.includes('runtz')) {
      return productImageMap['33333333-3333-3333-3333-333333333333'];
    }
    if (nameLower.includes('wedding') && nameLower.includes('cake')) {
      return productImageMap['44444444-4444-4444-4444-444444444444'];
    }
  }

  // Ultimate fallback
  return {
    main: PLACEHOLDER_IMAGE,
    gallery: [PLACEHOLDER_IMAGE],
    alt: productName || 'Cannabis Product',
  };
}

// Generate responsive image srcset for WebP images
export function generateSrcSet(imagePath: string): string {
  // For WebP images, we'll use the same image but let the browser handle sizing
  // In a production environment, you'd generate multiple sizes server-side
  return `${imagePath} 1x, ${imagePath} 2x`;
}

// Get optimal image sizes for different contexts
export function getImageSizes(context: 'card' | 'detail' | 'thumbnail'): string {
  switch (context) {
    case 'card':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
    case 'detail':
      return '(max-width: 768px) 100vw, 50vw';
    case 'thumbnail':
      return '(max-width: 640px) 25vw, 10vw';
    default:
      return '100vw';
  }
}
