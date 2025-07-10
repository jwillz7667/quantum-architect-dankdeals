import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { env } from './lib/env';
import { initializeAxe } from './utils/axe';
import { analytics } from './lib/analytics';

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  if (event.error && typeof event.error === 'object' && 'stack' in event.error) {
    console.error('Stack:', (event.error as Error).stack);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Initialize accessibility testing in development
void initializeAxe();

// Initialize analytics
void analytics.initialize();

// Validate environment variables on startup
(function validateEnvironment() {
  try {
    console.log(`🚀 Starting DankDeals in ${env.VITE_ENV} mode`);

    // Log environment status in production for debugging
    if (import.meta.env.PROD) {
      console.log('Environment check:', {
        hasSupabaseUrl: !!env.VITE_SUPABASE_URL,
        hasSupabaseKey: !!env.VITE_SUPABASE_ANON_KEY,
        environment: env.VITE_ENV,
      });
    }
  } catch (error) {
    console.error('Failed to validate environment:', error);

    // In production, show a more helpful error
    if (import.meta.env.PROD) {
      const rootElement = document.getElementById('root');
      if (rootElement) {
        // Check if it's specifically a Supabase configuration issue
        const isSupabaseError = error instanceof Error && error.message.includes('Supabase');

        rootElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui; padding: 20px;">
          <div style="text-align: center; max-width: 600px;">
            <h1 style="color: #ef4444; margin-bottom: 16px;">Configuration Error</h1>
            <p style="color: #6b7280; margin-bottom: 24px;">
              ${
                isSupabaseError
                  ? 'The application is missing required database configuration. Please ensure environment variables are properly set in Netlify.'
                  : 'The application failed to start due to a configuration issue.'
              }
            </p>
            <details style="text-align: left; background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
              <summary style="cursor: pointer; font-weight: 600;">Technical Details</summary>
              <pre style="margin-top: 8px; white-space: pre-wrap; word-break: break-all;">${error instanceof Error ? error.message : 'Unknown error'}</pre>
            </details>
            <p style="color: #6b7280;">Please contact support at <a href="mailto:admin@dankdealsmn.com" style="color: #8b5cf6;">admin@dankdealsmn.com</a></p>
          </div>
        </div>
      `;
      }
      // Don't re-throw the error to prevent blank page
      return;
    }
  }
})();

// Initialize error tracking in production
if (env.VITE_ENV === 'production' && env.VITE_SENTRY_DSN) {
  void import('@sentry/react')
    .then((Sentry) => {
      Sentry.init({
        dsn: env.VITE_SENTRY_DSN,
        environment: env.VITE_SENTRY_ENVIRONMENT || env.VITE_ENV,
        integrations: [Sentry.browserTracingIntegration()],
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
    })
    .catch((error) => {
      console.error('Failed to initialize Sentry:', error);
    });
}

// Set up performance monitoring
if (env.VITE_ENV === 'production') {
  // Log performance metrics
  window.addEventListener('load', () => {
    setTimeout(() => {
      try {
        const perfData = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        if (perfData) {
          console.log('Page Load Performance:', {
            domContentLoaded: Math.round(
              perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart
            ),
            loadComplete: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
            totalTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
          });
        }
      } catch (error) {
        console.error('Failed to log performance metrics:', error);
      }
    }, 0);
  });
}

// Render the app
try {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('Root element not found');
  }

  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);

  // Show fallback UI
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui; padding: 20px;">
        <div style="text-align: center;">
          <h1 style="color: #ef4444; margin-bottom: 16px;">Unable to Load Application</h1>
          <p style="color: #6b7280; margin-bottom: 16px;">Please try refreshing the page.</p>
          <button onclick="window.location.reload()" style="background: #8b5cf6; color: white; padding: 8px 24px; border: none; border-radius: 8px; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      </div>
    `;
  }
}
