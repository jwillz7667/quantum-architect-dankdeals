import React from 'react';
import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Error Boundary Provider for isolated error handling
export function IsolatedErrorBoundary({
  children,
  fallback,
  name = 'Component',
}: {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}) {
  return (
    <ErrorBoundary
      isolate
      fallback={
        fallback || (
          <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
            <p className="text-sm text-destructive">
              {name} failed to load. Please try refreshing the page.
            </p>
          </div>
        )
      }
    >
      {children}
    </ErrorBoundary>
  );
}
