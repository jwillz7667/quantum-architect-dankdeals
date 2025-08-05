import type { OutputOptions } from 'rollup';

// Optimized chunking strategy for better performance
export function createManualChunks(id: string): string | undefined {
  // Core React dependencies - must be handled first
  if (id.includes('node_modules/react-dom/')) return 'react-dom';
  if (id.includes('node_modules/react/')) return 'react';
  if (id.includes('node_modules/react-router-dom/')) return 'react-router';

  // UI libraries
  if (id.includes('@radix-ui')) return 'ui-radix';
  if (id.includes('@headlessui')) return 'ui-headless';
  if (id.includes('lucide-react')) return 'ui-icons';

  // Large third-party libraries
  if (id.includes('@supabase')) return 'lib-supabase';
  if (id.includes('@tanstack/react-query')) return 'lib-query';
  if (id.includes('date-fns')) return 'lib-date';

  // Form libraries
  if (id.includes('react-hook-form') || id.includes('@hookform')) return 'lib-forms';

  // Utilities
  if (
    id.includes('clsx') ||
    id.includes('tailwind-merge') ||
    id.includes('class-variance-authority')
  ) {
    return 'lib-utils';
  }

  // Keep polyfills separate
  if (id.includes('cross-fetch') || id.includes('node-fetch') || id.includes('polyfill')) {
    return 'polyfills';
  }

  // Other node_modules
  if (id.includes('node_modules/')) {
    const directories = id.split('/');
    const nodeModulesIndex = directories.indexOf('node_modules');
    if (nodeModulesIndex !== -1 && nodeModulesIndex < directories.length - 1) {
      const packageName = directories[nodeModulesIndex + 1];

      // Group small packages together
      const smallPackages = ['sonner', 'next-themes', 'react-helmet-async', 'zod', 'dompurify'];
      if (packageName && smallPackages.some((name) => packageName.includes(name))) {
        return 'vendor-misc';
      }

      // Keep other packages separate if they're large
      if (packageName) {
        return `vendor-${packageName.replace('@', '')}`;
      }
    }
  }
}

// Performance-optimized output options
export const outputOptions: Partial<OutputOptions> = {
  chunkFileNames: 'assets/js/[name]-[hash].js',
  entryFileNames: 'assets/js/[name]-[hash].js',
  assetFileNames: (assetInfo) => {
    const name = assetInfo.names?.[0] || 'asset';
    const extType = name.split('.').pop() || '';

    if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp|avif/i.test(extType)) {
      return `assets/img/[name]-[hash][extname]`;
    }
    if (/css/i.test(extType)) {
      return `assets/css/[name]-[hash][extname]`;
    }
    if (/woff2?|ttf|otf|eot/i.test(extType)) {
      return `assets/fonts/[name]-[hash][extname]`;
    }
    return `assets/[name]-[hash][extname]`;
  },
  // Better chunk imports
  generatedCode: {
    preset: 'es2015',
    arrowFunctions: true,
    constBindings: true,
    objectShorthand: true,
  },
  hoistTransitiveImports: true,
};
