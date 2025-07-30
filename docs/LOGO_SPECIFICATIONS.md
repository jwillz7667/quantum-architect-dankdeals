# Logo and Icon Specifications for DankDeals

## Essential Icon Sizes

### Favicon

- **favicon.ico**: Multi-resolution ICO file containing:
  - 16x16px
  - 32x32px
  - 48x48px
  - Format: ICO (can contain multiple sizes)

### PWA Icons (Required)

- **icon-192x192.png**: 192x192px (Required for PWA)
- **icon-512x512.png**: 512x512px (Required for splash screens)

### Apple Touch Icon

- **apple-touch-icon.png**: 180x180px (for iOS devices)

### Additional Recommended Sizes

- **icon-72x72.png**: 72x72px (older Android devices)
- **icon-96x96.png**: 96x96px (Chrome Web Store)
- **icon-128x128.png**: 128x128px (Chrome Web Store)
- **icon-144x144.png**: 144x144px (Microsoft Store)
- **icon-152x152.png**: 152x152px (older iOS devices)
- **icon-384x384.png**: 384x384px (high-res Android)

## Design Guidelines

### Safe Zone for Maskable Icons

For maskable icons, ensure your logo has a **safe zone** with padding:

- The important content should be within the center 80% of the icon
- Add at least 10% padding on all sides
- Background should extend to the edges

### Visual Example:

```
┌─────────────────┐
│                 │ ← 10% padding
│  ┌─────────┐   │
│  │         │   │
│  │  LOGO   │   │ ← Core content (80%)
│  │         │   │
│  └─────────┘   │
│                 │ ← 10% padding
└─────────────────┘
```

### Color and Background

- Use a solid background color (#ffffff or your brand green #4caf50)
- Ensure good contrast between logo and background
- For transparency, provide both transparent and solid background versions

### File Formats

- **PNG**: Use for all web icons (best quality, supports transparency)
- **ICO**: Use only for favicon.ico
- **SVG**: Keep as source/scalable version

## Recommended Creation Process

1. **Create Master Logo** (SVG or high-res PNG)
   - Design at 1024x1024px or larger
   - Include safe zone padding for maskable version

2. **Generate Size Variants**

   ```bash
   # Using ImageMagick (recommended)
   # First, install: brew install imagemagick

   # Generate all sizes from master logo
   convert logo-master.png -resize 512x512 icon-512x512.png
   convert logo-master.png -resize 384x384 icon-384x384.png
   convert logo-master.png -resize 192x192 icon-192x192.png
   convert logo-master.png -resize 180x180 apple-touch-icon.png
   convert logo-master.png -resize 152x152 icon-152x152.png
   convert logo-master.png -resize 144x144 icon-144x144.png
   convert logo-master.png -resize 128x128 icon-128x128.png
   convert logo-master.png -resize 96x96 icon-96x96.png
   convert logo-master.png -resize 72x72 icon-72x72.png

   # Generate favicon with multiple sizes
   convert logo-master.png -resize 16x16 favicon-16.png
   convert logo-master.png -resize 32x32 favicon-32.png
   convert logo-master.png -resize 48x48 favicon-48.png
   convert favicon-16.png favicon-32.png favicon-48.png favicon.ico
   ```

3. **Optimize File Sizes**

   ```bash
   # Using optipng (install: brew install optipng)
   optipng -o7 *.png

   # Or using pngquant for more compression
   pngquant --quality=85-95 *.png
   ```

## File Size Guidelines

- **icon-512x512.png**: Should be under 100KB
- **icon-192x192.png**: Should be under 30KB
- **favicon.ico**: Should be under 15KB
- Other icons: Proportionally smaller

## Where to Place Files

All icon files should be placed in the `/public` directory:

```
/public/
  ├── favicon.ico
  ├── icon-72x72.png
  ├── icon-96x96.png
  ├── icon-128x128.png
  ├── icon-144x144.png
  ├── icon-152x152.png
  ├── icon-192x192.png
  ├── icon-384x384.png
  ├── icon-512x512.png
  └── apple-touch-icon.png
```

## Testing Your Icons

1. **PWA Manifest Validator**: https://manifest-validator.appspot.com/
2. **Favicon Checker**: https://realfavicongenerator.net/favicon_checker
3. **Chrome DevTools**: Application > Manifest tab
4. **Test actual installation** on mobile devices

## Quick Start (Minimum Required)

If you want to start with just the essentials:

1. Create **icon-192x192.png** (192x192px)
2. Create **icon-512x512.png** (512x512px)
3. Create **favicon.ico** (containing 16x16, 32x32, 48x48)
4. Create **apple-touch-icon.png** (180x180px)

These four files will cover 99% of use cases!
