# PWA Icon Generation Guide

## Current Setup

The application uses SVG icons throughout for scalability and performance. The PWA manifest references these SVG files directly, which is supported by modern browsers.

## Converting SVG to PNG (If Required)

Some older devices or specific PWA features may require PNG icons. To generate PNG icons from the existing SVG files:

### Option 1: Using ImageMagick (Recommended)

```bash
# Install ImageMagick
brew install imagemagick  # macOS
sudo apt-get install imagemagick  # Ubuntu/Debian

# Generate PNG icons
convert public/icon-192x192.svg -resize 192x192 public/icon-192x192.png
convert public/icon-512x512.svg -resize 512x512 public/icon-512x512.png
```

### Option 2: Using Inkscape

```bash
# Install Inkscape
brew install --cask inkscape  # macOS

# Generate PNG icons
inkscape -w 192 -h 192 public/icon-192x192.svg -o public/icon-192x192.png
inkscape -w 512 -h 512 public/icon-512x512.svg -o public/icon-512x512.png
```

### Option 3: Using Sharp (Node.js)

```bash
# Install sharp
npm install --save-dev sharp

# Create a conversion script
node scripts/generate-png-icons.js
```

### Option 4: Online Converters

- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [Convertio](https://convertio.co/svg-png/)

## Updating the Manifest

If you generate PNG icons, update the manifest (`public/site.webmanifest`) to include both SVG and PNG versions:

```json
{
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ]
}
```

## Maskable Icons

The current SVG icons are configured with both "any" and "maskable" purposes. For optimal maskable icon display, ensure your icon has adequate padding (safe zone) around the main content.

## Testing PWA Installation

1. Open Chrome DevTools
2. Go to Application > Manifest
3. Check for any icon-related warnings
4. Test installation on different devices
