// Enhanced Rollup chunking configuration following best practices
// This file exports the manualChunks function for vite.config.ts

interface ModuleInfo {
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  importers?: readonly string[];
  code?: string | null;
}

// Match Rollup's ManualChunkMeta interface
interface ManualChunkMeta {
  getModuleInfo: (moduleId: string) => ModuleInfo | null;
  getModuleIds: () => IterableIterator<string>;
}

// Simplified framework groups - only major libraries that benefit from splitting
const FRAMEWORK_GROUPS = {
  // Core React ecosystem - always needed
  react: ['react', 'react-dom', 'react-router', 'react-router-dom', '@remix-run/router'],

  // Large UI libraries that should be split
  uiLibraries: {
    mui: ['@mui/material', '@mui/icons-material', '@mui/system', '@mui/lab', '@mui/base'],
    radix: ['@radix-ui'],
    headless: ['@headlessui', '@floating-ui'],
  },

  // Data layer - often loaded together
  data: ['@supabase', '@tanstack/react-query'],

  // Admin panel - lazy loaded
  admin: ['react-admin', 'ra-'],

  // Large utilities
  utils: ['lodash', 'lodash-es', 'date-fns', 'moment'],
};

export function createManualChunks() {
  return function manualChunks(id: string, { getModuleInfo }: ManualChunkMeta): string | undefined {
    // Skip virtual modules and externals
    if (id.includes('\0') || id.includes('virtual:') || id.startsWith('external:')) {
      return;
    }

    // Skip CSS modules
    if (id.endsWith('.css') || id.includes('.css?')) {
      return;
    }

    const moduleInfo = getModuleInfo(id);

    // Let entry points and their direct imports stay in the main bundle
    if (moduleInfo?.isEntry) {
      return;
    }

    // Check if it's a node_module
    const isNodeModule = id.includes('node_modules');

    // Application code - keep it simple
    if (!isNodeModule) {
      // Only split admin components if they're large enough
      if (id.includes('/components/admin/') || id.includes('/pages/admin/')) {
        return 'app-admin';
      }

      // Let all other app code stay in the main bundle
      return;
    }

    // Handle node_modules
    const packageMatch = id.match(/node_modules\/(?:@([^/]+)\/)?([^/]+)/);
    if (!packageMatch) return;

    const packageName = packageMatch[1]
      ? `@${packageMatch[1]}/${packageMatch[2]}`
      : packageMatch[2];

    // 1. React ecosystem - critical path
    if (FRAMEWORK_GROUPS.react.some((pkg) => packageName.startsWith(pkg))) {
      return 'framework-react';
    }

    // 2. Large UI libraries
    for (const [lib, packages] of Object.entries(FRAMEWORK_GROUPS.uiLibraries)) {
      if (packages.some((pkg) => packageName.startsWith(pkg))) {
        return `ui-${lib}`;
      }
    }

    // 3. Icons - often large and can be split
    if (packageName.includes('icons') || packageName === 'lucide-react') {
      return 'ui-icons';
    }

    // 4. Data layer
    if (FRAMEWORK_GROUPS.data.some((pkg) => packageName.startsWith(pkg))) {
      return 'lib-data';
    }

    // 5. Admin panel
    if (FRAMEWORK_GROUPS.admin.some((pkg) => packageName.startsWith(pkg))) {
      return 'admin-vendor';
    }

    // 6. Forms and validation
    if (['react-hook-form', 'zod', 'yup', '@hookform'].some((pkg) => packageName.startsWith(pkg))) {
      return 'lib-forms';
    }

    // 7. CSS-in-JS and styling - but NOT clsx or tailwind-merge as they're used in utils
    if (packageName.includes('emotion') || packageName.includes('styled-components')) {
      return 'lib-styles';
    }

    // Put clsx and tailwind-merge in utils chunk since they're used by the cn() utility
    if (packageName === 'clsx' || packageName === 'tailwind-merge') {
      return 'lib-utils';
    }

    // 8. Large utility libraries
    if (FRAMEWORK_GROUPS.utils.some((pkg) => packageName === pkg)) {
      return 'lib-utils';
    }

    // 9. Polyfills
    if (
      packageName.includes('polyfill') ||
      packageName.includes('core-js') ||
      packageName === 'cross-fetch'
    ) {
      return 'polyfills';
    }

    // 10. All other vendor code in numbered chunks
    // Use a simple hash to distribute packages consistently
    const hash = packageName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const chunkNumber = (hash % 3) + 1; // Creates vendor-1, vendor-2, vendor-3
    return `vendor-${chunkNumber}`;
  };
}

// Export configuration helper for common scenarios
export const chunkingPresets = {
  // Aggressive chunking for HTTP/2
  aggressive: {
    experimentalMinChunkSize: 10000,
  },
  // Balanced chunking for most apps - increased to reduce small chunks
  balanced: {
    experimentalMinChunkSize: 100000, // 100KB - aggressively merge small chunks
  },
  // Conservative chunking for HTTP/1.1
  conservative: {
    experimentalMinChunkSize: 100000, // 100KB
  },
};

// Build configuration presets
export const buildPresets = {
  aggressive: {
    chunkSizeWarningLimit: 200,
  },
  balanced: {
    chunkSizeWarningLimit: 500,
  },
  conservative: {
    chunkSizeWarningLimit: 1000,
  },
};
