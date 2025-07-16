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
    // Use ES2015 for maximum compatibility with older libraries
    target: 'es2015',
    // DISABLE MINIFICATION COMPLETELY
    minify: false,
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

          // Data fetching (Supabase + React Query)
          if (id.includes('@tanstack/react-query') || id.includes('@supabase/supabase-js')) {
            return 'query-vendor';
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

          // Other vendor libraries
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
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1500,

    // Additional optimization
    assetsInlineLimit: 4096,
    emptyOutDir: true,
    // Polyfill for Node.js globals
    define: {
      global: 'globalThis',
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
      target: 'es2015',
      // Preserve all names
      keepNames: true,
      minify: false,
      treeShaking: true,
      format: 'esm',
    },
  },

  esbuild: {
    target: 'es2015',
    // Keep all names to prevent minification issues
    keepNames: true,
    legalComments: 'none',
    // Don't drop anything
    drop: [],
  },
}));
