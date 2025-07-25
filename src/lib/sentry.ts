import * as Sentry from '@sentry/react';

// Initialize Sentry
export const initSentry = () => {
  const sentryDsn = import.meta.env['VITE_SENTRY_DSN'] as string | undefined;
  const environment = (import.meta.env['VITE_ENV'] as string) || 'development';

  if (!sentryDsn) {
    console.log('Sentry DSN not provided, skipping initialization');
    return;
  }

  if (environment === 'development') {
    console.log('Sentry disabled in development mode');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment,
    release: (import.meta.env['VITE_APP_VERSION'] as string) || '1.0.0',

    // Performance monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

    // Error sampling
    sampleRate: 1.0,

    // Basic integrations
    integrations: [],

    // Configure context
    beforeSend(event, _hint) {
      // Filter out development errors
      if (environment === 'development') {
        return null;
      }

      // Add custom context
      event.contexts = {
        ...event.contexts,
        app: {
          name: 'DankDeals',
          version: (import.meta.env['VITE_APP_VERSION'] as string) || '1.0.0',
        },
      };

      return event;
    },
  });
};

// Set user context
export const setSentryUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser(user);
};

// Clear user context
export const clearSentryUser = () => {
  Sentry.setUser(null);
};

// Capture exception
export const captureException = (error: Error, context?: Record<string, unknown>) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach((key) => {
        scope.setContext(key, context[key] as Record<string, unknown>);
      });
    }
    Sentry.captureException(error);
  });
};

// Capture message
export const captureMessage = (
  message: string,
  level: 'error' | 'warning' | 'info' | 'debug' = 'info'
) => {
  Sentry.captureMessage(message, level);
};

// Add breadcrumb
export const addBreadcrumb = (breadcrumb: {
  message: string;
  category?: string;
  level?: 'error' | 'warning' | 'info' | 'debug';
  data?: Record<string, unknown>;
}) => {
  Sentry.addBreadcrumb(breadcrumb);
};

// Set tag
export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

// Set context
export const setContext = (key: string, context: Record<string, unknown>) => {
  Sentry.setContext(key, context);
};

// Performance monitoring helpers (commented out - not available in current Sentry version)
// export const startTransaction = (name: string, op: string) => {
//   return Sentry.startTransaction({ name, op });
// };

// Error boundary component
export const SentryErrorBoundary = Sentry.withErrorBoundary;

// Profiler component
export const SentryProfiler = Sentry.withProfiler;
