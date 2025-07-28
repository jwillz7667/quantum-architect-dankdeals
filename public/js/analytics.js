// Plausible Analytics - Load asynchronously without blocking
(function () {
  // Ensure DOM is ready before loading analytics
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      loadAnalyticsScript();
    });
  } else {
    // DOM is already ready, load after a short delay
    setTimeout(loadAnalyticsScript, 100);
  }

  function loadAnalyticsScript() {
    // Use requestIdleCallback if available for better performance
    var loadAnalytics = function () {
      var script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.setAttribute('data-domain', 'dankdealsmn.com');
      script.src = 'https://plausible.io/js/script.js';
      document.head.appendChild(script);
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadAnalytics, { timeout: 2000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(loadAnalytics, 1);
    }
  }
})();
