/**
 * Bundle optimization utilities and configurations
 */

/**
 * List of modules that should be excluded from the initial bundle
 * These will be loaded on-demand when needed
 */
export const deferredModules = [
  'recharts', // Large charting library
  'react-window', // Virtualization library
  'dompurify', // HTML sanitization
  'react-day-picker', // Date picker component
] as const;

/**
 * Critical CSS that should be inlined for faster initial paint
 */
export const criticalCSS = `
  /* Critical CSS for above-the-fold content */
  :root {
    --primary: 98 80% 49%;
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
  }
  
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background: hsl(var(--background));
    color: hsl(var(--foreground));
  }
  
  .loading-skeleton {
    background: linear-gradient(90deg, hsl(0 0% 10%) 25%, hsl(0 0% 15%) 50%, hsl(0 0% 10%) 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

/**
 * Resource hints for critical assets
 */
export const resourceHints = {
  preconnect: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    import.meta.env['VITE_SUPABASE_URL'] as string,
  ].filter(Boolean),

  dnsPrefetch: ['https://plausible.io', 'https://vitals.vercel-insights.com'],

  prefetch: [
    '/assets/fonts/inter-var.woff2', // Variable font
  ],
};

/**
 * Webpack chunk optimization rules
 */
export const chunkOptimizationRules = {
  // Maximum size for initial chunks (in bytes)
  maxInitialSize: 244_000, // ~244KB gzipped

  // Maximum size for async chunks
  maxAsyncSize: 100_000, // ~100KB gzipped

  // Minimum size for creating a separate chunk
  minChunkSize: 20_000, // ~20KB

  // Modules that should always be in separate chunks
  forceSeparateChunks: ['recharts', '@radix-ui', 'react-hook-form', 'date-fns'],
};

/**
 * Performance budgets for monitoring
 */
export const performanceBudgets = {
  // First Contentful Paint
  fcp: 1800, // 1.8s

  // Largest Contentful Paint
  lcp: 2500, // 2.5s

  // Time to Interactive
  tti: 3800, // 3.8s

  // Bundle size budgets (gzipped)
  bundles: {
    main: 50_000, // 50KB
    vendor: 100_000, // 100KB
    total: 300_000, // 300KB
  },
};
