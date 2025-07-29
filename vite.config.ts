import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { Plugin } from 'vite';

// Custom plugin to preserve structured data in HTML
function preserveStructuredData(): Plugin {
  return {
    name: 'preserve-structured-data',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // Preserve JSON-LD structured data formatting
        // This prevents minification from breaking the JSON-LD scripts
        return html.replace(
          /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
          (match, json) => {
            try {
              // Parse and re-stringify to ensure valid JSON while preserving structure
              const parsed = JSON.parse(json as string) as Record<string, unknown>;
              const formatted = JSON.stringify(parsed, null, 2);
              return `<script type="application/ld+json">\n${formatted}\n</script>`;
            } catch (e) {
              // If parsing fails, return original
              console.warn('Failed to parse JSON-LD:', e);
              return match;
            }
          }
        );
      },
    },
  };
}

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
    preserveStructuredData(),
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
    // Configure terser to be less aggressive with HTML
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },
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
