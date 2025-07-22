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
        // Use a simpler chunking strategy to ensure React loads properly
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            '@tanstack/react-query',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-toast',
          ],
        },
        // Ensure proper module format
        format: 'es',
        // Optimize chunk names for caching
        chunkFileNames: 'assets/[name]-[hash].js',
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
