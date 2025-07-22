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
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        // Ensure all React dependencies are bundled together
        manualChunks: (id) => {
          // Bundle all React-related modules together to avoid loading issues
          if (
            id.includes('react') ||
            id.includes('react-dom') ||
            id.includes('scheduler') ||
            id.includes('react/jsx-runtime') ||
            id.includes('react/jsx-dev-runtime')
          ) {
            return 'react-vendor';
          }
          // Keep other vendor modules separate
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Ensure proper module format
        format: 'es',
        // Optimize chunk names for caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        // Ensure proper exports
        exports: 'auto',
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
      '@tanstack/react-query',
      '@supabase/supabase-js',
      // Include problematic dependencies
      'use-sidecar',
      'react-remove-scroll',
      // Include tslib for helper functions
      'tslib',
      // Include styling dependencies
      'clsx',
      'class-variance-authority',
      'tailwind-merge',
    ],
    exclude: ['react-dom/server', 'react-dom/server.node', '@react-email/render'],
    force: true, // Force re-optimization to ensure consistent builds
    esbuildOptions: {
      target: 'es2020',
      keepNames: true,
      minify: false, // Don't minify in optimizeDeps
      treeShaking: true,
      format: 'esm',
    },
  },

  esbuild: {
    target: 'es2020',
    keepNames: true,
    legalComments: 'none',
    // Don't drop console in production for debugging
    drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
    jsx: 'automatic', // Ensure automatic JSX runtime
  },
}));
