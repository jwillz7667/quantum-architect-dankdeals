import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
    }),
  ],
  define: {
    // Enable better tree shaking in production
    __DEV__: JSON.stringify(false),
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
    exclude: [
      // Exclude heavy libraries from pre-bundling to enable better tree shaking
      'dompurify',
      'recharts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    target: 'es2015',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react';
          }

          // UI component libraries
          if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('cmdk')) {
            return 'ui-components';
          }

          // Form handling
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
            return 'forms';
          }

          // Supabase
          if (id.includes('@supabase') || id.includes('supabase')) {
            return 'supabase';
          }

          // Date handling
          if (id.includes('date-fns') || id.includes('react-day-picker')) {
            return 'date-utils';
          }

          // Charts and data visualization
          if (
            id.includes('recharts') ||
            id.includes('react-window') ||
            id.includes('react-virtualized')
          ) {
            return 'charts';
          }

          // Other vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Optimize chunk loading
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
