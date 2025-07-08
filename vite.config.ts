import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        // Console and debug removal
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.warn'],

        // Safer compression settings
        passes: 1,

        // Dead code elimination
        dead_code: true,
        unused: true,

        // Basic optimizations
        collapse_vars: true,
        reduce_vars: true,
        hoist_funs: true,
        if_return: true,
        join_vars: true,

        // Conditional optimizations
        conditionals: true,
        evaluate: true,
        booleans: true,
        loops: true,
        sequences: true,

        // Size optimizations (removed toplevel and inline)
        properties: true,
        comparisons: true,
        computed_props: true,

        // Safe options
        negate_iife: true,
      },
      mangle: {
        safari10: true,
        // Removed toplevel to prevent breaking vendor code
        reserved: ['$', '_'],
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core (include scheduler to prevent runtime errors)
          if (
            id.includes('react') ||
            id.includes('react-dom') ||
            id.includes('react-router') ||
            id.includes('scheduler')
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

          // Admin pages (separate chunk since they're large)
          if (id.includes('/pages/admin/')) {
            return 'admin-vendor';
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
      },
    },
    cssCodeSplit: true,
    cssMinify: 'lightningcss',
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,

    // Additional optimization
    assetsInlineLimit: 4096,
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      'scheduler',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toast',
    ],
    esbuildOptions: {
      target: 'esnext',
      // Less aggressive optimization for vendor dependencies
      minify: false,
      treeShaking: false,
      format: 'esm',
    },
  },

  esbuild: {
    target: 'esnext',
    // Less aggressive minification for development
    minifyIdentifiers: mode === 'production',
    minifySyntax: true,
    minifyWhitespace: true,
    treeShaking: true,
    legalComments: 'none',
    drop: ['console', 'debugger'],
  },
}));
