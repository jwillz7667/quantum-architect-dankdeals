import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      babel: {
        plugins: [['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]],
      },
    }),
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli compression
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    // PWA support for caching
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'DankDeals MN',
        short_name: 'DankDeals',
        theme_color: '#4caf50',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
    }),
    // Bundle analyzer (only in analyze mode)
    process.env['ANALYZE'] &&
      visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean) as PluginOption[],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    target: 'es2020', // Updated to more modern target
    chunkSizeWarningLimit: 300, // Reduced to encourage smaller chunks
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        // Additional optimizations
        dead_code: true,
        evaluate: true,
        loops: true,
        module: true,
      },
      format: {
        comments: false,
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split('.').pop() || '';
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp|avif/i.test(extType)) {
            return `assets/img/[name]-[hash][extname]`;
          }
          if (/css/i.test(extType)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          if (/woff2?|ttf|otf|eot/i.test(extType)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        manualChunks: (id) => {
          // Bundle React and ReactDOM together to avoid loading issues
          if (id.includes('node_modules/react-dom/') || id.includes('node_modules/react/')) {
            return 'react-bundle';
          }
          if (id.includes('node_modules/react-router-dom/')) return 'react-router';

          // UI libraries
          if (id.includes('@radix-ui')) return 'radix-ui';
          if (id.includes('lucide-react')) return 'icons';

          // Data & API
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('@tanstack/react-query')) return 'react-query';

          // Utilities
          if (
            id.includes('clsx') ||
            id.includes('tailwind-merge') ||
            id.includes('class-variance-authority')
          )
            return 'utils';

          // Only create date-fns chunk if it's actually used
          // Remove this to prevent empty chunks
          // if (id.includes('date-fns')) return 'date-fns';

          // Form libraries
          if (id.includes('react-hook-form')) return 'forms';
          if (id.includes('@hookform')) return 'forms';
          if (id.includes('zod')) return 'forms'; // Add zod to forms chunk

          // Admin panel dependencies (code-split)
          if (id.includes('react-admin')) return 'admin-core';
          if (id.includes('ra-supabase')) return 'admin-data';
          if (id.includes('ra-input-rich-text')) return 'admin-rich-text';
          if (id.includes('@mui/material')) return 'admin-mui';
          if (id.includes('@mui/icons-material')) return 'admin-mui-icons';
          if (id.includes('@emotion')) return 'admin-emotion';

          // Other UI/DOM related
          if (id.includes('react-helmet-async')) return 'seo';
          if (id.includes('sonner')) return 'notifications';
          if (id.includes('next-themes')) return 'themes';

          // Split vendor chunk by package size and type
          if (id.includes('node_modules')) {
            // Extract package name
            const match = id.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
            if (!match) return 'vendor-misc';

            const packageName = match[1];

            // Already handled packages
            const handledPackages = [
              'react',
              'react-dom',
              'react-router-dom',
              '@radix-ui',
              '@supabase',
              '@tanstack',
              'lucide-react',
              'react-hook-form',
              '@hookform',
              'clsx',
              'tailwind-merge',
              'class-variance-authority',
              'react-helmet-async',
              'sonner',
              'next-themes',
              'zod',
              'react-admin',
              'ra-supabase',
              'ra-input-rich-text',
              '@mui/material',
              '@mui/icons-material',
              '@emotion',
            ];

            if (handledPackages.some((pkg) => packageName.startsWith(pkg))) {
              return undefined; // Let other rules handle it
            }

            // Group remaining packages by type
            // Crypto/Security packages
            if (packageName.includes('crypto') || packageName.includes('uuid')) {
              return 'vendor-crypto';
            }

            // HTTP/Network packages
            if (
              packageName.includes('axios') ||
              packageName.includes('fetch') ||
              packageName.includes('http')
            ) {
              return 'vendor-network';
            }

            // Polyfills and runtime helpers
            if (
              packageName.includes('polyfill') ||
              packageName.includes('core-js') ||
              packageName.includes('regenerator') ||
              packageName.includes('tslib')
            ) {
              return 'vendor-polyfills';
            }

            // Everything else in vendor-misc
            return 'vendor-misc';
          }
        },
      },
    },
    // Modern optimizations
    cssCodeSplit: true,
    assetsInlineLimit: 4096, // Inline assets < 4kb
    reportCompressedSize: false, // Faster builds
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'lucide-react',
      'react-hook-form',
      'zod',
      'clsx',
      'tailwind-merge',
    ],
    exclude: ['@vite/client', '@vite/env'],
    // Force optimization of CJS dependencies
    esbuildOptions: {
      target: 'es2020',
      // Ensure proper bundling of React
      keepNames: true,
    },
  },
});
