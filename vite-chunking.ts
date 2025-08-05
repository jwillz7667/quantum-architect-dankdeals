// Enhanced Rollup chunking configuration following best practices
// This file exports the manualChunks function for vite.config.ts

interface ModuleInfo {
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  importers?: string[];
  code?: string;
}

interface ChunkInfo {
  id: string;
  getModuleInfo: (id: string) => ModuleInfo | null;
}

// Framework groups for better chunk organization
const FRAMEWORK_GROUPS = {
  react: ['react', 'react-dom', 'scheduler', 'react-refresh'],
  reactEcosystem: ['react-router', 'react-router-dom', '@remix-run/router'],
  vue: ['vue', '@vue'],
  ui: {
    radix: ['@radix-ui'],
    mui: ['@mui/material', '@mui/icons-material', '@mui/system', '@mui/lab'],
    headless: ['@headlessui', '@floating-ui'],
    icons: ['lucide-react', 'react-icons', '@heroicons'],
  },
  forms: ['react-hook-form', '@hookform', 'zod', 'yup', 'joi'],
  state: ['@tanstack/react-query', 'redux', 'zustand', 'valtio', 'jotai', 'recoil'],
  data: ['@supabase', 'firebase', 'axios', 'ky', 'graphql'],
  admin: ['react-admin', 'ra-'],
  animation: ['framer-motion', 'react-spring', '@react-spring', 'auto-animate'],
  utils: ['lodash', 'lodash-es', 'ramda', 'date-fns', 'dayjs', 'moment'],
};

// Size thresholds for automatic vendor splitting
const SIZE_THRESHOLDS = {
  LARGE: 500 * 1024, // 500KB
  MEDIUM: 100 * 1024, // 100KB
  SMALL: 20 * 1024, // 20KB
};

export function createManualChunks() {
  // Track chunk sizes to prevent oversized chunks
  const chunkSizes = new Map<string, number>();

  return function manualChunks(id: string, { getModuleInfo }: ChunkInfo) {
    // Skip virtual modules and externals
    if (id.includes('\0') || id.includes('virtual:') || id.startsWith('external:')) {
      return;
    }

    // Get module information for better decisions
    const moduleInfo = getModuleInfo(id);
    const isEntry = moduleInfo?.isEntry ?? false;
    const isDynamicEntry = moduleInfo?.isDynamicEntry ?? false;
    const importers = moduleInfo?.importers ?? [];
    const moduleSize = moduleInfo?.code?.length ?? 0;

    // Handle entry points - don't chunk them
    if (isEntry) {
      return;
    }

    // Handle dynamic imports - let them create their own chunks
    if (isDynamicEntry && importers.length === 1) {
      return;
    }

    // Parse module ID for better categorization
    const isNodeModule = id.includes('node_modules');
    const packageMatch = id.match(/node_modules\/(?:@([^/]+)\/)?([^/]+)/);
    const packageName = packageMatch
      ? packageMatch[1]
        ? `@${packageMatch[1]}/${packageMatch[2]}`
        : packageMatch[2]
      : null;

    // Handle application code (non-node_modules)
    if (!isNodeModule) {
      // Group by feature/directory
      if (id.includes('/components/admin/')) return 'app-admin';
      if (id.includes('/components/common/')) return 'app-common';
      if (id.includes('/components/ui/')) return 'app-ui';
      if (id.includes('/hooks/')) return 'app-hooks';
      if (id.includes('/utils/')) return 'app-utils';
      if (id.includes('/services/')) return 'app-services';

      // Let small app modules stay with their importers
      if (moduleSize < SIZE_THRESHOLDS.SMALL) {
        return;
      }

      return 'app-main';
    }

    // Handle node_modules with framework detection
    if (packageName) {
      // 1. React Core - Critical for initial load
      if (FRAMEWORK_GROUPS.react.some((pkg) => packageName.startsWith(pkg))) {
        return 'framework-react';
      }

      // 2. React Router - Usually needed early
      if (FRAMEWORK_GROUPS.reactEcosystem.some((pkg) => packageName.includes(pkg))) {
        return 'framework-react-router';
      }

      // 3. UI Component Libraries - Group by library
      for (const [category, packages] of Object.entries(FRAMEWORK_GROUPS.ui)) {
        if (Array.isArray(packages) && packages.some((pkg) => packageName.startsWith(pkg))) {
          return `ui-${category}`;
        }
      }

      // 4. Form Libraries - Often used together
      if (FRAMEWORK_GROUPS.forms.some((pkg) => packageName.startsWith(pkg))) {
        return 'lib-forms';
      }

      // 5. State Management - Group similar solutions
      if (FRAMEWORK_GROUPS.state.some((pkg) => packageName.startsWith(pkg))) {
        return 'lib-state';
      }

      // 6. Data/API Libraries
      if (FRAMEWORK_GROUPS.data.some((pkg) => packageName.startsWith(pkg))) {
        return 'lib-data';
      }

      // 7. Admin Panel - Lazy loaded
      if (FRAMEWORK_GROUPS.admin.some((pkg) => packageName.startsWith(pkg))) {
        return 'admin-vendor';
      }

      // 8. Animation Libraries - Often optional
      if (FRAMEWORK_GROUPS.animation.some((pkg) => packageName.startsWith(pkg))) {
        return 'lib-animation';
      }

      // 9. Utility Libraries - Check size
      if (FRAMEWORK_GROUPS.utils.some((pkg) => packageName === pkg)) {
        // Split large utility libraries
        if (moduleSize > SIZE_THRESHOLDS.MEDIUM) {
          return `lib-${packageName.replace('@', '').replace('/', '-')}`;
        }
        return 'lib-utils';
      }

      // 10. CSS-in-JS libraries
      if (packageName.includes('emotion') || packageName.includes('styled-components')) {
        return 'lib-styles';
      }

      // 11. Polyfills and shims
      if (
        packageName.includes('polyfill') ||
        packageName.includes('core-js') ||
        packageName.includes('regenerator')
      ) {
        return 'polyfills';
      }

      // 12. Runtime helpers (not dev dependencies)
      if (packageName === '@babel/runtime' || packageName === '@babel/runtime-corejs3') {
        return 'polyfills';
      }

      // 13. Development dependencies that leaked to production
      const devPackages = [
        'eslint',
        'prettier',
        'typescript',
        'vite',
        'rollup',
        'webpack',
        'babel-core',
        'babel-preset',
        'babel-plugin',
      ];
      if (devPackages.some((dev) => packageName.includes(dev))) {
        console.warn(`⚠️ Development dependency in production: ${packageName}`);
        return 'vendor-dev';
      }

      // 14. Size-based vendor splitting for remaining packages
      const currentChunk = determineVendorChunk(packageName, moduleSize, chunkSizes);

      // Track chunk sizes
      const currentSize = chunkSizes.get(currentChunk) || 0;
      chunkSizes.set(currentChunk, currentSize + moduleSize);

      return currentChunk;
    }

    // Default fallback
    return 'vendor';
  };
}

// Helper function to determine vendor chunk based on size
function determineVendorChunk(
  packageName: string,
  moduleSize: number,
  chunkSizes: Map<string, number>
): string {
  // Large packages get their own chunk
  if (moduleSize > SIZE_THRESHOLDS.LARGE) {
    return `vendor-${packageName.replace('@', '').replace('/', '-')}`;
  }

  // Find the smallest vendor chunk that won't exceed LARGE threshold
  let targetChunk = 'vendor-1';
  let minSize = Infinity;

  for (let i = 1; i <= 5; i++) {
    const chunkName = `vendor-${i}`;
    const currentSize = chunkSizes.get(chunkName) || 0;

    if (currentSize + moduleSize < SIZE_THRESHOLDS.LARGE && currentSize < minSize) {
      targetChunk = chunkName;
      minSize = currentSize;
    }
  }

  return targetChunk;
}

// Export configuration helper for common scenarios
export const chunkingPresets = {
  // Aggressive chunking for HTTP/2
  aggressive: {
    experimentalMinChunkSize: 10000,
  },
  // Balanced chunking for most apps
  balanced: {
    experimentalMinChunkSize: 20000,
  },
  // Conservative chunking for HTTP/1.1
  conservative: {
    experimentalMinChunkSize: 50000,
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
