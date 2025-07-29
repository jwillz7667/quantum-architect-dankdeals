import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

type Module = { default: ComponentType<unknown> };
type ImportFunction = () => Promise<Module>;

interface LazyComponentWithPrefetch extends LazyExoticComponent<ComponentType<unknown>> {
  prefetch: () => Promise<Module>;
}

/**
 * Enhanced lazy loading with prefetch support
 * Use this instead of React.lazy() for better performance
 */
export function lazyWithPrefetch(importFunction: ImportFunction): LazyComponentWithPrefetch {
  const Component = lazy(importFunction) as LazyComponentWithPrefetch;
  Component.prefetch = importFunction;
  return Component;
}

/**
 * Prefetch a component when the browser is idle
 */
export function prefetchComponent(Component: LazyComponentWithPrefetch): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      void Component.prefetch();
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      void Component.prefetch();
    }, 1);
  }
}

/**
 * Prefetch components on hover/focus for faster navigation
 */
export function usePrefetchOnInteraction(Component: LazyComponentWithPrefetch) {
  const handleInteraction = () => {
    void Component.prefetch();
  };

  return {
    onMouseEnter: handleInteraction,
    onFocus: handleInteraction,
  };
}

/**
 * Prefetch critical routes after initial load
 */
export function prefetchCriticalRoutes(routes: LazyComponentWithPrefetch[]): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(
      () => {
        routes.forEach((route) => void route.prefetch());
      },
      { timeout: 3000 }
    );
  } else {
    setTimeout(() => {
      routes.forEach((route) => void route.prefetch());
    }, 3000);
  }
}
