import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import { createManualChunks, chunkingPresets, buildPresets } from './vite-chunking';

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
    // Use balanced build preset
    ...buildPresets.balanced,
    // Suppress node module externalization warnings (expected for Supabase)
    commonjsOptions: {
      transformMixedEsModules: true,
    },
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
        manualChunks: createManualChunks(),
        // Use balanced chunking preset
        ...chunkingPresets.balanced,
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
