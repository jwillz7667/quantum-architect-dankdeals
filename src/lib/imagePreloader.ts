/**
 * Modern image preloading utilities
 * Follows industry best practices for performance optimization
 */

interface PreloadImageOptions {
  crossOrigin?: 'anonymous' | 'use-credentials';
  imageSizes?: string;
  imageSrcset?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * Preload a single image with modern options
 */
export function preloadImage(href: string, options: PreloadImageOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already preloaded
    if (document.querySelector(`link[rel="preload"][href="${href}"]`)) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;

    if (options.crossOrigin) {
      link.crossOrigin = options.crossOrigin;
    }

    if (options.imageSizes) {
      link.imageSizes = options.imageSizes;
    }

    if (options.imageSrcset) {
      link.imageSrcset = options.imageSrcset;
    }

    if (options.fetchPriority) {
      link.fetchPriority = options.fetchPriority;
    }

    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to preload image: ${href}`));

    document.head.appendChild(link);
  });
}

/**
 * Preload critical hero/featured images
 * Only preloads the first 1-2 images to avoid network congestion
 */
export function preloadCriticalImages(imageUrls: string[], maxPreload = 1): void {
  const criticalImages = imageUrls.slice(0, maxPreload);

  criticalImages.forEach((url, index) => {
    preloadImage(url, {
      fetchPriority: index === 0 ? 'high' : 'low',
      crossOrigin: 'anonymous',
    }).catch((error) => {
      console.warn('Failed to preload critical image:', error);
    });
  });
}

/**
 * Smart preloading based on user behavior
 * Preloads images when user is likely to navigate to them
 */
export function preloadImageOnHover(element: HTMLElement, imageUrl: string): void {
  let preloaded = false;

  const handleMouseEnter = () => {
    if (!preloaded) {
      preloaded = true;
      preloadImage(imageUrl, { fetchPriority: 'low' }).catch(() => {
        // Silent failure for hover preloads
      });
    }
  };

  element.addEventListener('mouseenter', handleMouseEnter, { once: true });

  // Return cleanup function
  return (() => {
    element.removeEventListener('mouseenter', handleMouseEnter);
  }) as unknown as void;
}

/**
 * Preload images in viewport plus buffer
 * For infinite scroll or pagination scenarios
 */
export function preloadNearbyImages(
  imageUrls: string[],
  currentIndex: number,
  bufferSize = 2
): void {
  const start = Math.max(0, currentIndex - bufferSize);
  const end = Math.min(imageUrls.length, currentIndex + bufferSize + 1);

  for (let i = start; i < end; i++) {
    const imageUrl = imageUrls[i];
    if (i !== currentIndex && imageUrl) {
      preloadImage(imageUrl, { fetchPriority: 'low' }).catch(() => {
        // Silent failure for speculative preloads
      });
    }
  }
}
