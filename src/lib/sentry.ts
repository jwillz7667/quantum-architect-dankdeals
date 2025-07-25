import * as Sentry from '@sentry/react';
import { env } from '@/lib/env';
import React from 'react';

// Initialize Sentry
export const initSentry = () => {
  if (env.VITE_ENV === 'development') {
    console.log('Sentry disabled in development mode');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: env.VITE_ENV,
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    
    // Performance monitoring
    tracesSampleRate: env.VITE_ENV === 'production' ? 0.1 : 1.0,
    
    // Error sampling
    sampleRate: 1.0,
    
    // Session tracking
    autoSessionTracking: true,
    
    // Initialize performance monitoring
    integrations: [
      new Sentry.BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          window.location,
          window.history
        ),
      }),
      new Sentry.Replay({
        // Only capture replays for errors in production
        sessionSampleRate: 0.1,
        errorSampleRate: 1.0,
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Configure context
    beforeSend(event, hint) {
      // Filter out development errors
      if (env.VITE_ENV === 'development') {
        return null;
      }
      
      // Add custom context
      event.contexts = {
        ...event.contexts,
        app: {
          name: 'DankDeals',
          version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        },
      };
      
      // Don't send events for certain errors
      if (hint.originalException) {
        const error = hint.originalException;
        
        // Skip common browser errors
        if (error instanceof TypeError && error.message.includes('Network request failed')) {
          return null;
        }
        
        // Skip auth errors that are handled
        if (error instanceof Error && error.message.includes('supabase')) {
          // Only log critical auth errors
          if (!error.message.includes('session') && !error.message.includes('token')) {
            return event;
          }
          return null;
        }
      }
      
      return event;
    },
    
    // Don't capture console logs
    captureConsole: false,
    
    // Ignore certain URLs
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      
      // Network errors
      'NetworkError',
      'fetch',
      'XMLHttpRequest',
      
      // Age gate and common user actions
      'age_verified',
      'User denied',
      'Non-Error promise rejection captured',
    ],
    
    // Ignore certain transactions
    ignoreTransactions: [
      '/health',
      '/favicon.ico',
      '/robots.txt',
    ],
  });
};

// Set user context
export const setSentryUser = (user: {
  id: string;
  email?: string;
  username?: string;
}) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

// Clear user context (on logout)
export const clearSentryUser = () => {
  Sentry.setUser(null);
};

// Set custom context
export const setSentryContext = (key: string, context: Record<string, any>) => {
  Sentry.setContext(key, context);
};

// Add breadcrumb
export const addSentryBreadcrumb = (message: string, category: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
};

// Capture exception
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

// Capture message
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

// Start transaction
export const startTransaction = (name: string, op: string) => {
  return Sentry.startTransaction({ name, op });
};

// Create error boundary
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Profiler
export const SentryProfiler = Sentry.Profiler;

// Export Sentry for advanced usage
export { Sentry };