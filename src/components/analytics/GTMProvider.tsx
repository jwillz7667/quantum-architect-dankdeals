import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

interface GTMProviderProps {
  children: React.ReactNode;
}

/**
 * Google Tag Manager Provider
 * Initializes GTM and tracks page views
 */
export function GTMProvider({ children }: GTMProviderProps) {
  const location = useLocation();
  const GTM_ID = import.meta.env['VITE_GTM_ID'] as string | undefined;

  // Initialize GTM
  useEffect(() => {
    if (!GTM_ID || GTM_ID === 'GTM-XXXXXX') {
      console.info('GTM not configured. Set VITE_GTM_ID in .env');
      return;
    }

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];

    // GTM script injection
    const script = document.createElement('script');
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${GTM_ID}');
    `;
    document.head.appendChild(script);

    // GTM noscript fallback
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
      height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.insertBefore(noscript, document.body.firstChild);

    // Push initial page view
    window.dataLayer.push({
      event: 'gtm.init',
      'gtm.uniqueEventId': Date.now(),
    });
  }, [GTM_ID]);

  // Track page views on route change
  useEffect(() => {
    if (!GTM_ID || !window.dataLayer) return;

    window.dataLayer.push({
      event: 'page_view',
      page_path: location.pathname,
      page_search: location.search,
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [location, GTM_ID]);

  return <>{children}</>;
}
