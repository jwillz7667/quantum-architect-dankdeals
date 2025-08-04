import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initializeGA, trackPageView } from '@/lib/google-analytics';

/**
 * Google Analytics tracking component
 * Only use this if you're NOT using Google Tag Manager for GA4
 */
export function GoogleAnalytics() {
  const location = useLocation();

  // Initialize GA on mount
  useEffect(() => {
    initializeGA();
  }, []);

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location]);

  return null;
}
