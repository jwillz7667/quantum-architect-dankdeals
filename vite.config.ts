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

          // React core (include scheduler to prevent runtime errors)
          if (
            id.includes('node_modules/react/') ||
            (id.includes('node_modules/react-dom/') && !id.includes('server')) ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/react-router-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }

          // Radix UI components (only loaded with specific pages)
          if (id.includes('@radix-ui')) {
            return 'ui-vendor';
          }

          // Split data fetching libraries into separate chunks
          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }

          if (id.includes('@supabase/supabase-js')) {
            return 'supabase-vendor';
          }

          // Form libraries (only loaded with forms)
          if (
            id.includes('react-hook-form') ||
            id.includes('@hookform/resolvers') ||
            id.includes('zod')
          ) {
            return 'form-vendor';
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

          // Split large libraries into separate chunks for better loading
          if (id.includes('node_modules/@supabase/supabase-js')) {
            return 'supabase-vendor';
          }

          if (id.includes('node_modules/react-query') || id.includes('node_modules/@tanstack')) {
            return 'query-vendor';
          }

          if (id.includes('node_modules/date-fns')) {
            return 'date-vendor';
          }

          if (id.includes('node_modules/tailwind') || id.includes('node_modules/clsx')) {
            return 'styles-vendor';
          }

          // Split helmet (SEO) into separate chunk
          if (id.includes('node_modules/react-helmet')) {
            return 'seo-vendor';
          }

          // Split commonly unused libraries into separate chunks
          if (id.includes('node_modules/framer-motion')) {
            return 'animation-vendor';
          }

          if (
            id.includes('node_modules/react-helmet') ||
            id.includes('node_modules/react-helmet-async')
          ) {
            return 'seo-vendor';
          }

          if (id.includes('node_modules/react-query') || id.includes('node_modules/@tanstack')) {
            return 'query-vendor';
          }

          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'charts-vendor';
          }

          if (id.includes('node_modules/lodash') || id.includes('node_modules/ramda')) {
            return 'utils-vendor';
          }

          // Other vendor libraries (keep smaller)
          if (id.includes('node_modules')) {
            return 'vendor';
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
    chunkSizeWarningLimit: 500,

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
