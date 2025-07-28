// Preload Supabase connection to reduce latency
export function preloadSupabaseConnection() {
  // Only run in browser
  if (typeof window === 'undefined') return;

  // Use requestIdleCallback if available, otherwise use setTimeout
  const schedulePreload = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));

  schedulePreload(() => {
    // Create a dummy image to establish connection to Supabase
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = 'https://ralbzuvkyexortqngvxs.supabase.co';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    // Also preconnect to the auth endpoint
    const authLink = document.createElement('link');
    authLink.rel = 'preconnect';
    authLink.href = 'https://ralbzuvkyexortqngvxs.supabase.co';
    document.head.appendChild(authLink);
  });
}
