/**
 * Icon Preloader for Critical Icons
 * Preloads frequently used icons to improve initial page load performance
 */

const criticalIcons = [
  '/assets/icons/Asset 4.svg', // Shopping cart
  '/assets/icons/Asset 3.svg', // Search
  '/assets/icons/Asset 1.svg', // Cannabis leaf
];

/**
 * Preloads critical icons into session storage
 * Should be called early in the app lifecycle
 */
export async function preloadCriticalIcons(): Promise<void> {
  try {
    const preloadPromises = criticalIcons.map(async (iconPath) => {
      const cacheKey = `icon-${iconPath.split('/').pop()?.replace('.svg', '')}`;

      // Skip if already cached
      if (sessionStorage.getItem(cacheKey)) {
        return;
      }

      try {
        const response = await fetch(iconPath);
        if (response.ok) {
          const svgContent = await response.text();
          sessionStorage.setItem(cacheKey, svgContent);
        }
      } catch (error) {
        console.warn(`Failed to preload icon: ${iconPath}`, error);
      }
    });

    await Promise.all(preloadPromises);
  } catch (error) {
    console.warn('Icon preloading failed:', error);
  }
}

/**
 * Checks if critical icons are preloaded
 */
export function areCriticalIconsPreloaded(): boolean {
  return criticalIcons.every((iconPath) => {
    const cacheKey = `icon-${iconPath.split('/').pop()?.replace('.svg', '')}`;
    return sessionStorage.getItem(cacheKey) !== null;
  });
}

/**
 * Clears icon cache (useful for development or cache invalidation)
 */
export function clearIconCache(): void {
  const keys = Object.keys(sessionStorage);
  keys.forEach((key) => {
    if (key.startsWith('icon-')) {
      sessionStorage.removeItem(key);
    }
  });
}
