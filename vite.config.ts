import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  // Best practice: Define env prefix for security
  envPrefix: 'VITE_',
  server: {
    host: '::',
    port: 8080,
    // Vite 5 best practice: enable HMR with WebSocket
    hmr: {
      overlay: true,
    },
    // Better error handling in dev
    strictPort: false,
    open: false,
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
    // Best practice: Prefer module over jsnext:main or browser
    mainFields: ['module', 'jsnext:main', 'jsnext', 'main'],
    // Best practice: Optimize extension resolution
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
  build: {
    outDir: 'dist',
    // Best practice: Generate sourcemaps for production debugging
    sourcemap: 'hidden', // Hidden sourcemaps for production
    minify: 'terser',
    // Best practice: Use browserslist or explicit browser versions
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    // Best practice: 500KB is more realistic for modern apps
    chunkSizeWarningLimit: 500,
    // Best practice: Use lightningcss for better CSS optimization (fallback to default if not available)
    cssMinify: true,
    // Enable CSS code splitting
    cssCodeSplit: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
        // Advanced optimizations
        dead_code: true,
        evaluate: true,
        loops: true,
        module: true,
        toplevel: true,
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unused: true,
      },
      format: {
        comments: false,
        ascii_only: true, // Better compatibility
      },
      mangle: {
        safari10: true,
        toplevel: true,
        properties: {
          regex: /^_/, // Mangle properties starting with _
        },
      },
    },
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        // Optimize module format
        generatedCode: {
          preset: 'es2015',
          arrowFunctions: true,
          constBindings: true,
          objectShorthand: true,
        },
        // Better chunk imports
        hoistTransitiveImports: true,
        assetFileNames: (assetInfo) => {
          const extType = (assetInfo.names?.[0] || assetInfo.name)?.split('.').pop() || '';
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

            if (handledPackages.some((pkg) => packageName?.startsWith(pkg))) {
              return undefined; // Let other rules handle it
            }

            // Group remaining packages by type
            // Specific large packages that should have their own chunks
            if (packageName === 'dompurify') return 'vendor-sanitization';
            if (packageName === 'dotenv') return 'vendor-env';
            if (packageName === 'web-vitals') return 'vendor-monitoring';
            if (packageName?.includes('@axe-core')) return 'vendor-accessibility';
            if (packageName?.includes('@vercel/analytics')) return 'vendor-analytics';

            // Best practice: Handle @babel/runtime specifically
            if (packageName === '@babel/runtime' || packageName === '@babel/runtime-corejs3') {
              return 'vendor-babel-runtime';
            }

            // RxJS (large dependency from react-admin)
            if (packageName?.includes('rxjs') || packageName === 'rxjs') {
              return 'vendor-rxjs';
            }

            // Error tracking and monitoring
            if (packageName?.includes('@sentry') || packageName?.includes('sentry')) {
              return 'vendor-error-tracking';
            }

            // Polyfills and ES shims
            if (
              packageName?.includes('es-abstract') ||
              packageName?.includes('es-shim') ||
              packageName?.includes('es5-shim') ||
              packageName?.includes('es6-shim')
            ) {
              return 'vendor-es-shims';
            }

            // Lodash and utility libraries
            if (
              packageName?.includes('lodash') ||
              packageName === 'underscore' ||
              packageName === 'ramda'
            ) {
              return 'vendor-utilities';
            }

            // Tailwind should not be in runtime bundles at all
            // If it's here, something is importing it incorrectly
            if (packageName?.includes('tailwindcss')) {
              console.warn(
                `WARNING: tailwindcss is being bundled into runtime! Package: ${packageName}`
              );
              return 'vendor-css-framework';
            }

            // Crypto/Security packages
            if (
              packageName?.includes('crypto') ||
              packageName?.includes('uuid') ||
              packageName?.includes('jwt') ||
              packageName?.includes('jose')
            ) {
              return 'vendor-crypto';
            }

            // HTTP/Network packages
            if (
              packageName?.includes('axios') ||
              packageName?.includes('fetch') ||
              packageName?.includes('http') ||
              packageName?.includes('cross-fetch')
            ) {
              return 'vendor-network';
            }

            // Polyfills and runtime helpers
            if (
              packageName?.includes('polyfill') ||
              packageName?.includes('core-js') ||
              packageName?.includes('regenerator') ||
              packageName?.includes('tslib') ||
              packageName === 'object-assign'
            ) {
              return 'vendor-polyfills';
            }

            // Date/Time libraries
            if (
              packageName?.includes('date-fns') ||
              packageName?.includes('dayjs') ||
              packageName?.includes('moment')
            ) {
              return 'vendor-datetime';
            }

            // State management
            if (
              packageName?.includes('redux') ||
              packageName?.includes('recoil') ||
              packageName?.includes('zustand') ||
              packageName?.includes('valtio') ||
              packageName?.includes('jotai')
            ) {
              return 'vendor-state';
            }

            // Parsing/Validation
            if (
              packageName?.includes('yup') ||
              packageName?.includes('joi') ||
              packageName?.includes('ajv') ||
              packageName?.includes('superstruct')
            ) {
              return 'vendor-validation';
            }

            // DOM/Browser utilities (including DOMPurify)
            if (
              packageName?.includes('dom') ||
              packageName?.includes('browser') ||
              packageName?.includes('scroll') ||
              packageName?.includes('resize') ||
              packageName?.includes('purify')
            ) {
              return 'vendor-dom';
            }

            // Animation libraries (including tailwindcss-animate)
            if (
              packageName?.includes('framer') ||
              packageName?.includes('spring') ||
              packageName?.includes('motion') ||
              packageName?.includes('animate')
            ) {
              return 'vendor-animation';
            }

            // Build tool dependencies that shouldn't be in runtime
            if (
              packageName?.includes('webpack') ||
              packageName?.includes('rollup') ||
              packageName?.includes('vite') ||
              packageName?.includes('esbuild') ||
              packageName?.includes('babel') ||
              packageName?.includes('typescript') ||
              packageName?.includes('postcss') ||
              packageName?.includes('autoprefixer')
            ) {
              console.warn(`WARNING: Build tool in runtime bundle: ${packageName}`);
              return 'vendor-build-tools';
            }

            // Everything else in vendor-misc
            return 'vendor-misc';
          }
        },
        // Best practice: Prevent too many small chunks
        experimentalMinChunkSize: 20000, // 20KB minimum
      },
      // Tree shaking optimizations
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: 'no-external',
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    },
    // Best practice: Optimize asset handling
    assetsInlineLimit: 4096, // Inline assets < 4kb
    // Best practice: Skip compressed size reporting for faster builds
    reportCompressedSize: false,
    // Best practice: Write manifest for asset tracking
    manifest: true,
    // Best practice: Consistent output file naming
    emptyOutDir: true,
  },
  // Best practice: Optimize dependencies
  optimizeDeps: {
    // Include commonly used dependencies
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
      // Add dependencies that cause issues if not pre-bundled
      'react-helmet-async',
      'sonner',
    ],
    exclude: ['@vite/client', '@vite/env'],
    // Best practice: Optimize esbuild for better compatibility
    esbuildOptions: {
      target: 'es2020',
      // Ensure proper bundling
      keepNames: true,
      // Best practice: Support JSX in .js files
      loader: {
        '.js': 'jsx',
      },
    },
  },
  // Best practice: Preview server configuration
  preview: {
    port: 5000,
    strictPort: false,
    host: true,
    cors: true,
  },
});
