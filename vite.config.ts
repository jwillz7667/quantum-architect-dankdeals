import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

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
        plugins: [
          // Remove propTypes in production for smaller bundle
          ['babel-plugin-transform-react-remove-prop-types', { removeImport: true }],
        ],
      },
    }),
    // Bundle visualization only in analyze mode
    ...(process.env['ANALYZE']
      ? [
          visualizer({
            filename: './dist/stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
  ],
  define: {
    // Enable better tree shaking in production
    __DEV__: JSON.stringify(false),
    'process.env.NODE_ENV': JSON.stringify(process.env['NODE_ENV'] || 'production'),
  },
  optimizeDeps: {
    // Pre-bundle core dependencies for faster dev server startup
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react',
    ],
    // Exclude heavy libraries from pre-bundling to enable better tree shaking
    exclude: ['dompurify', 'recharts'],
    // Force optimize deps even in production builds
    force: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env['NODE_ENV'] !== 'production', // Only in dev/staging
    minify: 'terser',
    target: 'es2018', // Modern browsers support
    chunkSizeWarningLimit: 500, // Stricter limit
    // Configure terser to be less aggressive with HTML
    terserOptions: {
      compress: {
        drop_console: process.env['NODE_ENV'] === 'production',
        drop_debugger: true,
        dead_code: true,
        unused: true,
        // Advanced optimizations
        passes: 3,
        pure_funcs: ['console.log', 'console.debug', 'console.trace'],
        pure_getters: true,
        side_effects: false,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
        // Preserve necessary comments for licenses
        preserve_annotations: true,
      },
    },
    rollupOptions: {
      output: {
        // Let Vite handle automatic chunking for better optimization
        // Optimize chunk loading with shorter hashes
        chunkFileNames: 'assets/js/[name]-[hash:8].js',
        entryFileNames: 'assets/js/[name]-[hash:8].js',
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split('.').pop() || '';
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/img/[name]-[hash:8][extname]`;
          }
          if (/css/i.test(extType)) {
            return `assets/css/[name]-[hash:8][extname]`;
          }
          if (/woff2?|ttf|otf|eot/i.test(extType)) {
            return `assets/fonts/[name]-[hash:8][extname]`;
          }
          return `assets/[name]-[hash:8][extname]`;
        },
        // Generate clean sourcemap references
        sourcemapFileNames: '[name]-[hash:8].map',
      },
      // Tree shaking optimizations
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
      // Experimental features for better optimization
      experimentalLogSideEffects: true,
    },
    // CSS optimization
    cssCodeSplit: true,
    // Asset optimization
    assetsInlineLimit: 4096, // 4KB
    // Report compressed sizes
    reportCompressedSize: true,
  },
  // Experimental features
  experimental: {
    renderBuiltUrl() {
      // Use relative paths for better CDN support
      return { relative: true };
    },
  },
});
