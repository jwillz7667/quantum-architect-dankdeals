// Plausible Analytics - Load after page load
window.addEventListener('load', function () {
  var script = document.createElement('script');
  script.defer = true;
  script.setAttribute('data-domain', 'dankdealsmn.com');
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
});
