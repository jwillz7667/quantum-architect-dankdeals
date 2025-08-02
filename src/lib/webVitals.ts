import type { Metric } from 'web-vitals';
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

// Removed Vercel Analytics specific code since we're deploying on Netlify
// This prevents CSP violations and unnecessary dependencies

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function sendToAnalytics(metric: Metric) {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric.rating);
  }

  // Send to analytics endpoint - disabled for Netlify deployment
  // Vercel Analytics is not needed when deployed on Netlify
  // This prevents CSP violations and unnecessary network requests
  /*
  if (import.meta.env.PROD && window.location.hostname !== 'localhost') {
    const body = {
      dsn: import.meta.env['VITE_VERCEL_ANALYTICS_ID'] as string | undefined,
      id: metric.id,
      page: window.location.pathname,
      href: window.location.href,
      event_name: metric.name,
      value: metric.value.toString(),
      speed: getConnectionSpeed(),
    };

    const blob = new Blob([JSON.stringify(body)], {
      type: 'application/json',
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(vitalsUrl, blob);
    } else {
      void fetch(vitalsUrl, {
        body: blob,
        method: 'POST',
        credentials: 'omit',
        keepalive: true,
      });
    }
  }
  */

  // Custom analytics handling
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
      non_interaction: true,
    });
  }
}

export function reportWebVitals() {
  // Core Web Vitals
  onCLS(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
  onINP(sendToAnalytics);
}

// Performance observer for resource timing
export function observeResourceTiming() {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;

          // Log slow resources
          if (resourceEntry.duration > 1000) {
            console.warn(`Slow resource: ${resourceEntry.name} took ${resourceEntry.duration}ms`);
          }
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }
}

// Custom performance marks
export function markPerformance(markName: string) {
  if ('performance' in window && performance.mark) {
    performance.mark(markName);
  }
}

export function measurePerformance(measureName: string, startMark: string, endMark: string) {
  if ('performance' in window && performance.measure) {
    try {
      performance.measure(measureName, startMark, endMark);
      const measure = performance.getEntriesByName(measureName)[0];

      if (measure && import.meta.env.DEV) {
        console.log(`[Performance] ${measureName}: ${measure.duration}ms`);
      }
    } catch (_e) {
      // Marks may not exist
    }
  }
}
