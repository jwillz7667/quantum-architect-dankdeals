#!/usr/bin/env node

/**
 * PWA Icon Generator for DankDeals
 * Generates all required PWA icons and assets
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes required for PWA
const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

// Favicon sizes
const faviconSizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 96, name: 'favicon-96x96.png' },
];

// Apple touch icon
const appleTouchIcon = { size: 180, name: 'apple-touch-icon.png' };

// Create SVG icon as base (cannabis leaf with DankDeals branding)
const createBaseSVG = (size = 512) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#22c55e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#185a1b;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="url(#leafGradient)" filter="url(#shadow)"/>
  
  <!-- Cannabis leaf -->
  <g transform="translate(256,256)">
    <!-- Main leaf shape -->
    <path d="M0,-100 C-20,-80 -30,-50 -35,-20 C-40,0 -35,20 -20,35 C-10,45 0,50 10,45 C20,35 35,20 40,0 C35,-20 30,-50 20,-80 C10,-90 0,-100 0,-100 Z" 
          fill="#ffffff" opacity="0.9"/>
    
    <!-- Left leaflets -->
    <path d="M-35,-20 C-50,-15 -60,-5 -65,10 C-60,20 -50,25 -35,20 C-25,15 -20,5 -25,-10 Z" 
          fill="#ffffff" opacity="0.8"/>
    <path d="M-45,-40 C-60,-35 -70,-25 -75,-10 C-70,0 -60,5 -45,-5 C-35,-10 -30,-20 -35,-35 Z" 
          fill="#ffffff" opacity="0.7"/>
    
    <!-- Right leaflets -->
    <path d="M35,-20 C50,-15 60,-5 65,10 C60,20 50,25 35,20 C25,15 20,5 25,-10 Z" 
          fill="#ffffff" opacity="0.8"/>
    <path d="M45,-40 C60,-35 70,-25 75,-10 C70,0 60,5 45,-5 C35,-10 30,-20 35,-35 Z" 
          fill="#ffffff" opacity="0.7"/>
    
    <!-- Center vein -->
    <line x1="0" y1="-90" x2="0" y2="40" stroke="#ffffff" stroke-width="2" opacity="0.6"/>
  </g>
  
  <!-- Brand text (for larger icons) -->
  ${
    size >= 192
      ? `
  <text x="256" y="400" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="36" font-weight="bold">
    DankDeals
  </text>
  <text x="256" y="430" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="16" opacity="0.8">
    Minnesota
  </text>
  `
      : ''
  }
</svg>
`;

// Create favicon ICO placeholder
const createFaviconICO = () => `
<!-- This is a placeholder for favicon.ico -->
<!-- In production, you should use a proper ICO file -->
`;

// Create browserconfig.xml for Windows tiles
const createBrowserConfig = () => `
<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo src="/icon-72x72.png"/>
      <square150x150logo src="/icon-144x144.png"/>
      <square310x310logo src="/icon-384x384.png"/>
      <wide310x150logo src="/icon-384x384.png"/>
      <TileColor>#185a1b</TileColor>
    </tile>
  </msapplication>
</browserconfig>
`;

// Create maskable icon versions (simplified for demo)
const createMaskableIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Safe area for maskable icons (80% of total size) -->
  <circle cx="256" cy="256" r="205" fill="#22c55e"/>
  
  <!-- Simplified cannabis leaf for maskable version -->
  <g transform="translate(256,256)">
    <path d="M0,-60 C-15,-50 -20,-30 -25,-10 C-30,10 -25,25 -15,35 C-5,40 5,40 15,35 C25,25 30,10 25,-10 C20,-30 15,-50 0,-60 Z" 
          fill="#ffffff"/>
    <text y="50" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="20" font-weight="bold">
      DD
    </text>
  </g>
</svg>
`;

// Generate screenshot placeholders
const createScreenshotPlaceholder = (width, height, label) => `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="100%" height="100%" fill="url(#bg)"/>
  
  <!-- Mock header -->
  <rect x="0" y="0" width="100%" height="60" fill="#185a1b"/>
  <text x="20" y="35" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="bold">
    DankDeals
  </text>
  
  <!-- Mock content -->
  <rect x="20" y="80" width="60%" height="20" fill="#cbd5e1" rx="4"/>
  <rect x="20" y="120" width="80%" height="15" fill="#e2e8f0" rx="4"/>
  <rect x="20" y="150" width="70%" height="15" fill="#e2e8f0" rx="4"/>
  
  <!-- Mock product cards -->
  <rect x="20" y="190" width="120" height="120" fill="#f1f5f9" rx="8"/>
  <rect x="160" y="190" width="120" height="120" fill="#f1f5f9" rx="8"/>
  <rect x="300" y="190" width="120" height="120" fill="#f1f5f9" rx="8"/>
  
  <!-- Label -->
  <text x="${width / 2}" y="${height - 30}" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="14">
    ${label}
  </text>
</svg>
`;

// Main function to generate all assets
async function generatePWAAssets() {
  const publicDir = path.join(__dirname, '..', 'public');

  console.log('🚀 Generating PWA assets for DankDeals...');

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Generate main PWA icons
  console.log('📱 Generating PWA icons...');
  iconSizes.forEach(({ size, name }) => {
    const svg = createBaseSVG(size);
    fs.writeFileSync(path.join(publicDir, name.replace('.png', '.svg')), svg);
    console.log(`  ✅ Generated ${name.replace('.png', '.svg')} (${size}x${size})`);
  });

  // Generate favicon sizes
  console.log('🔗 Generating favicons...');
  faviconSizes.forEach(({ size, name }) => {
    const svg = createBaseSVG(size);
    fs.writeFileSync(path.join(publicDir, name.replace('.png', '.svg')), svg);
    console.log(`  ✅ Generated ${name.replace('.png', '.svg')} (${size}x${size})`);
  });

  // Generate Apple touch icon
  console.log('🍎 Generating Apple touch icon...');
  const appleSvg = createBaseSVG(appleTouchIcon.size);
  fs.writeFileSync(path.join(publicDir, appleTouchIcon.name.replace('.png', '.svg')), appleSvg);
  console.log(
    `  ✅ Generated ${appleTouchIcon.name.replace('.png', '.svg')} (${appleTouchIcon.size}x${appleTouchIcon.size})`
  );

  // Generate favicon.ico placeholder
  console.log('🏠 Generating favicon.ico...');
  const faviconSvg = createBaseSVG(32);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);
  console.log('  ✅ Generated favicon.svg');

  // Generate browserconfig.xml
  console.log('🪟 Generating browserconfig.xml...');
  fs.writeFileSync(path.join(publicDir, 'browserconfig.xml'), createBrowserConfig());
  console.log('  ✅ Generated browserconfig.xml');

  // Generate screenshots
  console.log('📸 Generating screenshot placeholders...');
  const mobileScreenshot = createScreenshotPlaceholder(
    390,
    844,
    'Mobile view of DankDeals cannabis delivery app'
  );
  fs.writeFileSync(path.join(publicDir, 'screenshot-mobile.svg'), mobileScreenshot);
  console.log('  ✅ Generated screenshot-mobile.svg');

  const desktopScreenshot = createScreenshotPlaceholder(
    1920,
    1080,
    'Desktop view of DankDeals cannabis delivery app'
  );
  fs.writeFileSync(path.join(publicDir, 'screenshot-desktop.svg'), desktopScreenshot);
  console.log('  ✅ Generated screenshot-desktop.svg');

  console.log('\n✨ PWA assets generated successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Convert SVG icons to PNG using an online converter or imagemagick');
  console.log('2. Replace placeholder screenshots with real app screenshots');
  console.log('3. Test PWA installability with Chrome DevTools');
  console.log('4. Validate manifest at https://manifest-validator.appspot.com/');

  console.log('\n🔧 Optional optimizations:');
  console.log('- Use a design tool to create custom icons');
  console.log('- Add maskable icon versions for better Android support');
  console.log('- Optimize PNG files for better performance');
}

// Run the generator
if (import.meta.url === `file://${process.argv[1]}`) {
  generatePWAAssets().catch(console.error);
}

export { generatePWAAssets };
