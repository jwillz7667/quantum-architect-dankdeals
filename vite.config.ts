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
      output: {
        // Industry-standard chunking strategy for optimal performance
        manualChunks: (id) => {
          // Core React dependencies - loaded immediately
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react';
          }

          // React Router - needed for navigation
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }

          // UI framework dependencies - loaded with first interaction
          if (
            id.includes('@radix-ui') ||
            id.includes('react-remove-scroll') ||
            id.includes('use-sidecar')
          ) {
            return 'ui-framework';
          }

          // State management and data fetching
          if (id.includes('@tanstack/react-query') || id.includes('@supabase')) {
            return 'data-layer';
          }

          // Heavy dependencies - lazy loaded
          if (id.includes('lucide-react')) {
            return 'icons';
          }

          // Form validation - only loaded on forms
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
            return 'forms';
          }

          // Utility libraries
          if (
            id.includes('clsx') ||
            id.includes('class-variance-authority') ||
            id.includes('tailwind-merge')
          ) {
            return 'utils';
          }

          // Animation libraries - lazy loaded
          if (id.includes('framer-motion')) {
            return 'animation';
          }

          // Date utilities - lazy loaded
          if (id.includes('date-fns')) {
            return 'date-utils';
          }

          // Let Vite handle vendor chunking for remaining modules
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
        // Optimize chunk names for caching
        chunkFileNames: (chunkInfo) => {
          return `assets/${chunkInfo.name}-[hash].js`;
        },
        // Keep chunks under 244KB for optimal HTTP/2 performance
        // But not too small to avoid excessive requests
        manualChunksMaxSize: 244000,
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
      // Preload critical chunks
      resolveDependencies: (filename, deps, _context) => {
        // Always preload React and main chunks
        return deps.filter(
          (dep) => dep.includes('react') || dep.includes('index') || dep.includes('react-router')
        );
      },
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
