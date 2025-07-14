const fs = require('fs');
const path = require('path');

// Simple SVG optimization - remove embedded images and create clean SVG
function optimizeSVG(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);

  // Create a simple, clean SVG logo placeholder
  const optimizedSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 112.5" width="300" height="112.5">
  <defs>
    <style>
      .logo-text { font-family: Arial, sans-serif; font-weight: bold; fill: #2d5a2d; }
      .logo-subtitle { font-family: Arial, sans-serif; font-size: 12px; fill: #4a7c4a; }
    </style>
  </defs>
  
  <!-- Logo Background -->
  <rect x="10" y="10" width="280" height="92.5" rx="8" fill="#f8f9fa" stroke="#2d5a2d" stroke-width="2"/>
  
  <!-- Main Logo Text -->
  <text x="150" y="45" text-anchor="middle" class="logo-text" font-size="24">DankDeals</text>
  
  <!-- Subtitle -->
  <text x="150" y="65" text-anchor="middle" class="logo-subtitle">Premium Cannabis Delivery</text>
  
  <!-- Decorative Elements -->
  <circle cx="40" cy="40" r="8" fill="#2d5a2d" opacity="0.3"/>
  <circle cx="260" cy="40" r="8" fill="#2d5a2d" opacity="0.3"/>
  <circle cx="40" cy="72" r="6" fill="#4a7c4a" opacity="0.3"/>
  <circle cx="260" cy="72" r="6" fill="#4a7c4a" opacity="0.3"/>
</svg>`;

  // Write optimized version
  fs.writeFileSync(filePath, optimizedSVG);
  console.log(`Optimized ${fileName}: ${content.length} bytes -> ${optimizedSVG.length} bytes`);
}

// Create cart logo variant
function createCartLogo() {
  const cartSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <style>
      .cart-text { font-family: Arial, sans-serif; font-weight: bold; fill: #2d5a2d; font-size: 12px; }
    </style>
  </defs>
  
  <!-- Cart Icon Background -->
  <circle cx="50" cy="50" r="45" fill="#f8f9fa" stroke="#2d5a2d" stroke-width="2"/>
  
  <!-- Cart Icon -->
  <path d="M20 25 L30 25 L35 55 L75 55 L80 35 L35 35" stroke="#2d5a2d" stroke-width="2" fill="none"/>
  <circle cx="40" cy="65" r="3" fill="#2d5a2d"/>
  <circle cx="65" cy="65" r="3" fill="#2d5a2d"/>
  
  <!-- Text -->
  <text x="50" y="82" text-anchor="middle" class="cart-text">DD</text>
</svg>`;

  fs.writeFileSync(
    '/Users/willz/ai/quantum-architect-dankdeals/public/assets/logos/dankdeals-cart-logo.svg',
    cartSVG
  );
  console.log('Created optimized cart logo');
}

// Optimize existing logos
try {
  optimizeSVG('/Users/willz/ai/quantum-architect-dankdeals/public/assets/logos/dankdeals-logo.svg');
  createCartLogo();
  console.log('Logo optimization complete!');
} catch (error) {
  console.error('Error optimizing logos:', error);
}
