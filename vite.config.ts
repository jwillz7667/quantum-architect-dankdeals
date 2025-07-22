import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode: _mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Force a single version of React and React DOM
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    // Use ES2020 for better performance and smaller bundles
    target: 'es2020',
    // Use esbuild for React-safe minification
    minify: 'esbuild',
    rollupOptions: {
      external: [
        // Exclude server-side React DOM modules from browser bundle
        'react-dom/server',
        'react-dom/server.node',
        'react-dom/server.browser',
        '@react-email/render',
        'stream',
        'util',
      ],
      // Improve tree shaking
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
      output: {
        // Use function form for manualChunks to better control chunking
        manualChunks: (id) => {
          // Skip server-side modules entirely
          if (
            id.includes('react-dom/server') ||
            id.includes('server.node') ||
            id.includes('server.browser') ||
            id.includes('server-legacy')
          ) {
            return undefined;
          }

          // Problematic libraries that need special handling
          if (id.includes('use-sidecar') || id.includes('react-remove-scroll')) {
            return 'sidecar-vendor';
          }

          // React core (keep minimal)
          if (
            id.includes('node_modules/react/') ||
            (id.includes('node_modules/react-dom/') && !id.includes('server')) ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }

          // React Router (separate from React core)
          if (
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/react-router-dom/')
          ) {
            return 'router-vendor';
          }

          // Radix UI components (split more granularly)
          if (id.includes('@radix-ui/react-dialog')) {
            return 'radix-dialog-vendor';
          }
          if (id.includes('@radix-ui/react-dropdown-menu')) {
            return 'radix-dropdown-vendor';
          }
          if (id.includes('@radix-ui/react-toast')) {
            return 'radix-toast-vendor';
          }
          if (id.includes('@radix-ui')) {
            return 'radix-other-vendor';
          }

          // Split data fetching libraries into separate chunks
          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }

          if (id.includes('@supabase/supabase-js') || id.includes('node_modules/@supabase/')) {
            return 'supabase-vendor';
          }

          // Form libraries (only loaded with forms)
          if (id.includes('react-hook-form')) {
            return 'react-hook-form-vendor';
          }
          if (id.includes('@hookform/resolvers')) {
            return 'hookform-resolvers-vendor';
          }
          if (id.includes('zod')) {
            return 'zod-vendor';
          }

          // Checkout pages (separate chunk - only loaded during checkout)
          if (id.includes('/pages/checkout/')) {
            return 'checkout-vendor';
          }

          // Profile pages (separate chunk - only loaded in profile)
          if (id.includes('/pages/profile/')) {
            return 'profile-vendor';
          }

          // Lucide icons (split from main bundle)
          if (id.includes('lucide-react')) {
            return 'icons-vendor';
          }

          // Date handling libraries
          if (id.includes('node_modules/date-fns')) {
            return 'date-vendor';
          }

          // CSS-in-JS and utility libraries
          if (id.includes('node_modules/tailwind')) {
            return 'tailwind-vendor';
          }
          if (id.includes('node_modules/clsx')) {
            return 'clsx-vendor';
          }
          if (id.includes('node_modules/class-variance-authority')) {
            return 'cva-vendor';
          }

          // Split helmet (SEO) into separate chunk
          if (
            id.includes('node_modules/react-helmet') ||
            id.includes('node_modules/react-helmet-async')
          ) {
            return 'seo-vendor';
          }

          // Animation libraries
          if (id.includes('node_modules/framer-motion')) {
            return 'animation-vendor';
          }

          // Chart libraries (only loaded with admin/analytics)
          if (id.includes('node_modules/recharts')) {
            return 'recharts-vendor';
          }
          if (id.includes('node_modules/d3')) {
            return 'd3-vendor';
          }

          // Utility libraries
          if (id.includes('node_modules/lodash')) {
            return 'lodash-vendor';
          }
          if (id.includes('node_modules/ramda')) {
            return 'ramda-vendor';
          }

          // Split large individual libraries
          if (id.includes('node_modules/tslib')) {
            return 'tslib-vendor';
          }

          // More aggressive vendor splitting by package name
          if (id.includes('node_modules/')) {
            const match = id.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
            if (match && match[1]) {
              const packageName = match[1];

              // Group type definitions together
              if (packageName.startsWith('@types/')) {
                return 'types-vendor';
              }

              // Group build tools together
              if (
                packageName.startsWith('@babel/') ||
                packageName.startsWith('@rollup/') ||
                packageName.startsWith('@vite/')
              ) {
                return 'build-tools-vendor';
              }

              // Group testing libraries together
              if (
                packageName.includes('test') ||
                packageName.includes('spec') ||
                packageName.includes('jest') ||
                packageName.includes('vitest')
              ) {
                return 'test-vendor';
              }

              // Split by individual package for smaller chunks
              const cleanName = packageName
                .replace('@', '')
                .replace('/', '-')
                .replace(/[^a-zA-Z0-9-]/g, '');
              return `${cleanName}-vendor`;
            }
            return 'misc-vendor';
          }
        },
        // Preserve module structure for better debugging
        preserveModules: false,
        // Use named exports
        exports: 'named',
      },
    },
    cssCodeSplit: true,
    cssMinify: 'lightningcss',
    // Improve CSS loading
    cssTarget: 'es2020',
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 800,

    // Additional optimization
    assetsInlineLimit: 4096,
    emptyOutDir: true,
    // Polyfill for Node.js globals
    define: {
      global: 'globalThis',
    },
    // Module preloading optimizations
    modulePreload: {
      polyfill: false,
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'scheduler',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toast',
      // Include problematic dependencies
      'use-sidecar',
      'react-remove-scroll',
      // Include tslib for helper functions
      'tslib',
      // Include resend but exclude server components
      'resend',
    ],
    exclude: ['react-dom/server', 'react-dom/server.node', '@react-email/render'],
    force: true, // Force re-optimization to ensure consistent builds
    esbuildOptions: {
      target: 'es2020',
      keepNames: true,
      minify: true,
      treeShaking: true,
      format: 'esm',
    },
  },

  esbuild: {
    target: 'es2020',
    keepNames: true,
    legalComments: 'none',
    drop: ['console', 'debugger'],
  },
}));
