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
    // Use ES2018 for broader compatibility while supporting modern features
    target: ['es2018', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    // Use terser for production, no minification for development
    minify: mode === 'production' ? 'terser' : false,
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'],
        // Preserve function names for libraries that depend on them
        keep_fnames: true,
      },
      mangle: {
        // Don't mangle function names
        keep_fnames: true,
        // Don't mangle class names
        keep_classnames: true,
        // Reserve names that might be used by libraries
        reserved: ['__name', '__esModule', '_interopRequireDefault'],
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        // Use function form for manualChunks to better control chunking
        manualChunks: (id) => {
          // Problematic libraries that need special handling
          if (id.includes('use-sidecar') || id.includes('react-remove-scroll')) {
            return 'sidecar-vendor';
          }

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
    chunkSizeWarningLimit: 1000,

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
      'scheduler',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toast',
      // Include problematic dependencies
      'use-sidecar',
      'react-remove-scroll',
    ],
    exclude: [],
    esbuildOptions: {
      target: 'es2018',
      // Preserve all names
      keepNames: true,
      minify: false,
      treeShaking: true,
      format: 'esm',
    },
  },

  esbuild: {
    target: 'es2018',
    // Keep all names to prevent minification issues
    keepNames: true,
    legalComments: 'none',
    // Only drop debugger in production
    drop: mode === 'production' ? ['debugger'] : [],
  },
}));
