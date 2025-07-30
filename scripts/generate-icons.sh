#!/bin/bash

# Script to generate all required icons from logo-master.png
# Requires ImageMagick to be installed

echo "🎨 Starting icon generation..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick is not installed. Please install it first:"
    echo "   macOS: brew install imagemagick"
    echo "   Ubuntu: sudo apt-get install imagemagick"
    exit 1
fi

# Navigate to public directory
cd "$(dirname "$0")/../public" || exit 1

# Check if logo-master.png exists
if [ ! -f "logo-master.png" ]; then
    echo "❌ logo-master.png not found in public directory"
    exit 1
fi

echo "📦 Generating PNG icons..."

# Generate all PNG icons with proper sizes
convert logo-master.png -resize 512x512 icon-512x512.png
echo "✅ Generated icon-512x512.png"

convert logo-master.png -resize 384x384 icon-384x384.png
echo "✅ Generated icon-384x384.png"

convert logo-master.png -resize 192x192 icon-192x192.png
echo "✅ Generated icon-192x192.png"

convert logo-master.png -resize 180x180 apple-touch-icon.png
echo "✅ Generated apple-touch-icon.png"

convert logo-master.png -resize 152x152 icon-152x152.png
echo "✅ Generated icon-152x152.png"

convert logo-master.png -resize 144x144 icon-144x144.png
echo "✅ Generated icon-144x144.png"

convert logo-master.png -resize 128x128 icon-128x128.png
echo "✅ Generated icon-128x128.png"

convert logo-master.png -resize 96x96 icon-96x96.png
echo "✅ Generated icon-96x96.png"

convert logo-master.png -resize 72x72 icon-72x72.png
echo "✅ Generated icon-72x72.png"

# Generate favicon components
convert logo-master.png -resize 48x48 favicon-48x48.png
echo "✅ Generated favicon-48x48.png"

convert logo-master.png -resize 32x32 favicon-32x32.png
echo "✅ Generated favicon-32x32.png"

convert logo-master.png -resize 16x16 favicon-16x16.png
echo "✅ Generated favicon-16x16.png"

# Create multi-resolution favicon.ico
echo "🔧 Creating multi-resolution favicon.ico..."
convert favicon-16x16.png favicon-32x32.png favicon-48x48.png favicon.ico
echo "✅ Generated favicon.ico"

# Generate maskable icons with extra padding (for PWA)
echo "🎭 Generating maskable icons with safe zone..."

# Create a version with extra padding for maskable icons
convert logo-master.png -resize 80% -gravity center -background white -extent 192x192 icon-192x192-maskable.png
echo "✅ Generated icon-192x192-maskable.png"

convert logo-master.png -resize 80% -gravity center -background white -extent 512x512 icon-512x512-maskable.png
echo "✅ Generated icon-512x512-maskable.png"

# Clean up temporary favicon PNGs
rm -f favicon-48x48.png favicon-32x32.png favicon-16x16.png

# Optimize PNG files
if command -v optipng &> /dev/null; then
    echo "🔍 Optimizing PNG files..."
    optipng -quiet -o2 *.png
    echo "✅ PNG optimization complete"
else
    echo "ℹ️  Install optipng for PNG optimization: brew install optipng"
fi

echo "🎉 Icon generation complete!"
echo ""
echo "Generated files:"
ls -la *.png favicon.ico | grep -E "(\.png|\.ico)$" | awk '{print "  - " $9 " (" $5 " bytes)"}'