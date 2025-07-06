import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { env } from './lib/env';
import { initializeAxe } from './utils/axe';
import { analytics } from './lib/analytics';

// Initialize accessibility testing in development
void initializeAxe();

// Initialize analytics
void analytics.initialize();

// Validate environment variables on startup
try {
  console.log(`🚀 Starting DankDeals in ${env.VITE_ENV} mode`);
} catch (error) {
  console.error('Failed to start application:', error);
  // Show error page in production
  if (import.meta.env.PROD) {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui;">
        <div style="text-align: center;">
          <h1>Configuration Error</h1>
          <p>The application failed to start due to a configuration issue.</p>
          <p>Please contact support at admin@dankdealsmn.com</p>
        </div>
      </div>
    `;
    }
    throw error;
  }
}

// Initialize error tracking in production
if (env.VITE_ENV === 'production' && env.VITE_SENTRY_DSN) {
  void import('@sentry/react').then(({ init, browserTracingIntegration }) => {
    init({
      dsn: env.VITE_SENTRY_DSN,
      environment: env.VITE_SENTRY_ENVIRONMENT || env.VITE_ENV,
      integrations: [browserTracingIntegration()],
      tracesSampleRate: 0.1, // 10% of transactions
      beforeSend(event) {
        // Don't send events in development
        if (env.VITE_ENV !== 'production') {
          return null;
        }
        // Remove sensitive data
        if (event.request?.cookies) {
          delete event.request.cookies;
        }
        if (event.extra) {
          delete event.extra.password;
          delete event.extra.token;
        }
        return event;
      },
    });
  });
}

// Set up performance monitoring
if (env.VITE_ENV === 'production') {
  // Log performance metrics
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (perfData) {
        console.log('Page Load Performance:', {
          domContentLoaded: Math.round(
            perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart
          ),
          loadComplete: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
          totalTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
        });
      }
    }, 0);
  });
}

// Initialize accessibility checker
void initializeAxe();

// Remove unused queryClient - it's already created inside App component
// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       staleTime: 60 * 1000,
//       retry: 1,
//     },
//   },
// });

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
