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
    // Use ES2015 target to avoid ES2022 static blocks that break netlify-plugin-js-obfuscator
    target: 'es2015',
    // Switch to esbuild for safer vendor minification
    minify: 'esbuild',
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
      target: 'es2015',
      // Less aggressive optimization for vendor dependencies
      minify: false,
      treeShaking: false,
      format: 'esm',
    },
  },

  esbuild: {
    target: 'es2015',
    // Safer minification settings
    minifyIdentifiers: false,
    minifySyntax: true,
    minifyWhitespace: true,
    treeShaking: false,
    legalComments: 'none',
    // Only drop console.log and console.debug in production, keep error/warn
    drop: mode === 'production' ? ['debugger'] : [],
    pure: mode === 'production' ? ['console.log', 'console.debug'] : [],
    keepNames: true,
  },
}));
