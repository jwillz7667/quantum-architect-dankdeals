// Plausible Analytics - Load asynchronously without blocking
(function () {
  // Use requestIdleCallback if available, otherwise fallback to setTimeout
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
})();
