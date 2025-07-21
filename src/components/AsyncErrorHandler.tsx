// src/components/AsyncErrorHandler.tsx
import React from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { APIError, ValidationError } from '@/lib/api/client';
import { logger } from '@/lib/logger';

interface ErrorInfo {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

interface AsyncErrorHandlerProps {
  error: Error | null;
  onRetry?: () => void;
  onReset?: () => void;
  showHomeButton?: boolean;
  customActions?: React.ReactNode;
  className?: string;
}

/**
 * Type guard to check if error is an APIError
 */
function isAPIError(error: Error): error is APIError {
  return error instanceof APIError || 'status' in error;
}

/**
 * Type guard to check if error is a ValidationError
 */
function isValidationError(error: Error): error is ValidationError {
  return error instanceof ValidationError || 'issues' in error;
}

/**
 * Extract error information safely
 */
function extractErrorInfo(error: Error): ErrorInfo {
  if (isAPIError(error)) {
    return {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.data,
    };
  }

  if (isValidationError(error)) {
    const issues = (error).issues || [];
    const message = issues
      .map(
        (issue: { path: string[]; message: string }) => `${issue.path.join('.')}: ${issue.message}`
      )
      .join(', ');

    return {
      message: message || 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: issues,
    };
  }

  return {
    message: error.message || 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Get user-friendly error message based on error type
 */
function getUserFriendlyMessage(errorInfo: ErrorInfo): { title: string; description: string } {
  const { status, code, message } = errorInfo;

  if (isNetworkError(message)) {
    return {
      title: 'Connection Problem',
      description: 'Please check your internet connection and try again.',
    };
  }

  if (status) {
    switch (status) {
      case 400:
        return {
          title: 'Invalid Request',
          description: 'The request could not be processed. Please check your input.',
        };
      case 401:
        return {
          title: 'Authentication Required',
          description: 'Please log in to continue.',
        };
      case 403:
        return {
          title: 'Access Denied',
          description: 'You do not have permission to perform this action.',
        };
      case 404:
        return {
          title: 'Not Found',
          description: 'The requested resource could not be found.',
        };
      case 429:
        return {
          title: 'Too Many Requests',
          description: 'Please wait a moment before trying again.',
        };
      case 500:
        return {
          title: 'Server Error',
          description: 'Something went wrong on our end. Please try again later.',
        };
      default:
        return {
          title: 'Request Failed',
          description: message || 'An unexpected error occurred.',
        };
    }
  }

  if (code === 'VALIDATION_ERROR') {
    return {
      title: 'Invalid Input',
      description: message || 'Please check your input and try again.',
    };
  }

  return {
    title: 'Error',
    description: message || 'An unexpected error occurred.',
  };
}

/**
 * Check if error is network-related
 */
function isNetworkError(message: string): boolean {
  const networkKeywords = ['network', 'fetch', 'connection', 'timeout', 'offline'];
  return networkKeywords.some((keyword) => message.toLowerCase().includes(keyword));
}

/**
 * AsyncErrorHandler Component
 */
export const AsyncErrorHandler: React.FC<AsyncErrorHandlerProps> = ({
  error,
  onRetry,
  onReset,
  showHomeButton = false,
  customActions,
  className = '',
}) => {
  if (!error) return null;

  const errorInfo = extractErrorInfo(error);
  const { title, description } = getUserFriendlyMessage(errorInfo);

  // Log error for debugging
  logger.error('AsyncErrorHandler caught error', error, {
    errorInfo,
    timestamp: new Date().toISOString(),
  });

  const handleRetry = () => {
    if (onRetry) {
      logger.info('User initiated retry', { errorInfo });
      onRetry();
    }
  };

  const handleReset = () => {
    if (onReset) {
      logger.info('User initiated reset', { errorInfo });
      onReset();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] p-6 ${className}`}>
      <div className="w-full max-w-md space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </div>

        {/* Development Error Details */}
        {import.meta.env.DEV && (
          <Alert className="text-left">
            <AlertDescription>
              <details className="text-sm">
                <summary className="font-medium cursor-pointer">
                  Technical Details (Development Only)
                </summary>
                <div className="mt-2 space-y-1 text-xs font-mono bg-gray-50 p-2 rounded">
                  <div>
                    <strong>Error:</strong> {error.message}
                  </div>
                  {errorInfo.code && (
                    <div>
                      <strong>Code:</strong> {errorInfo.code}
                    </div>
                  )}
                  {errorInfo.status && (
                    <div>
                      <strong>Status:</strong> {errorInfo.status}
                    </div>
                  )}
                  {error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{error.stack}</pre>
                    </div>
                  )}
                </div>
              </details>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          {onRetry && (
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}

          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleGoBack} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>

            {showHomeButton && (
              <Button variant="outline" onClick={handleGoHome} className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            )}
          </div>

          {onReset && (
            <Button variant="ghost" onClick={handleReset} className="w-full">
              Reset Application
            </Button>
          )}

          {customActions}
        </div>
      </div>
    </div>
  );
};

// Default error boundary fallback
export const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({
  error,
  resetError,
}) => (
  <AsyncErrorHandler
    error={error}
    onRetry={resetError}
    onReset={resetError}
    showHomeButton={true}
  />
);
