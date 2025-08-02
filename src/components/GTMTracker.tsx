import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/gtm';

export function GTMTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track page views on route change
    trackPageView(location.pathname, document.title);
  }, [location.pathname]);

  return null;
}
