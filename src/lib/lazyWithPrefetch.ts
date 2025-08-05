import type { ComponentType, LazyExoticComponent } from 'react';
import { lazy } from 'react';

// Type for a lazy component with prefetch capability
interface LazyComponentWithPrefetch<T extends ComponentType<unknown>>
  extends LazyExoticComponent<T> {
  prefetch: () => Promise<{ default: T }>;
}

// Extended lazy function with prefetch capability
export function lazyWithPrefetch<T extends ComponentType<unknown>>(
  importFunc: () => Promise<{ default: T }>
): LazyComponentWithPrefetch<T> {
  const Component = lazy(importFunc) as LazyComponentWithPrefetch<T>;

  // Add prefetch method
  Component.prefetch = importFunc;

  return Component;
}

// Prefetch critical routes after the app becomes idle
export function prefetchCriticalRoutes(
  routes: Array<LazyComponentWithPrefetch<ComponentType<unknown>>>
) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(
      () => {
        routes.forEach((route) => {
          void route.prefetch();
        });
      },
      { timeout: 3000 }
    );
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(() => {
      routes.forEach((route) => {
        void route.prefetch();
      });
    }, 3000);
  }
}
