// src/components/ErrorBoundary.tsx
import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean; // Whether to isolate errors to this boundary
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // In development, also log to console for debugging
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Optional: Report to external error tracking service
    // this.reportError(error, errorInfo);
  }

  override componentWillUnmount() {
    // Clean up any subscriptions or timers if needed
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  scheduleReset = (delay: number) => {
    this.resetTimeoutId = setTimeout(() => {
      this.handleReset();
    }, delay);
  };

  handleReset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  override render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      const { error, errorInfo, errorCount } = this.state;
      const isDevelopment = import.meta.env.DEV;
      const isNetworkError =
        error.message.toLowerCase().includes('network') ||
        error.message.toLowerCase().includes('fetch');
      const isChunkError =
        error.message.toLowerCase().includes('chunk') ||
        error.message.toLowerCase().includes('module');

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                {isNetworkError
                  ? "We're having trouble connecting to our servers."
                  : isChunkError
                    ? 'The application needs to be refreshed to load the latest version.'
                    : "An unexpected error occurred. Don't worry, we're on it!"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User-friendly error message */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>
                  {error.message || 'An unexpected error occurred'}
                </AlertDescription>
              </Alert>

              {/* Error metadata */}
              {errorCount > 1 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    This error has occurred {errorCount} times.
                    {errorCount >= 3 && ' The page will auto-reset in a few seconds.'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Developer details (only in development) */}
              {isDevelopment && errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    Developer Details
                  </summary>
                  <div className="mt-2 space-y-2">
                    <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto">
                      {error.stack}
                    </pre>
                    <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button onClick={this.handleReset} variant="default" className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={this.handleReload} variant="outline" className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {/* Support message */}
              <p className="text-sm text-muted-foreground text-center pt-4">
                If this problem persists, please contact support at{' '}
                <a href="mailto:support@dankdealsmn.com" className="text-primary hover:underline">
                  support@dankdealsmn.com
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
