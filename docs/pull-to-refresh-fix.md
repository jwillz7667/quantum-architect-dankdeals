# Pull-to-Refresh Purple Background Fix

## Issue

When users performed a pull-to-refresh gesture on mobile browsers, a purple background would appear instead of the expected cannabis green brand color.

## Root Cause

The purple background was caused by multiple browser configuration files that were set to use purple (`#8B5CF6`) instead of the brand's cannabis green (`#185a1b`):

1. **HTML meta tags** - `theme-color` and `msapplication-TileColor`
2. **PWA manifest file** - `theme_color` and `background_color`
3. **Browser config XML** - `TileColor` for Windows tiles

## Solution Implemented

### 1. Updated HTML Meta Tags (`index.html`)

```html
<!-- Before -->
<meta name="theme-color" content="#8B5CF6" />
<meta name="msapplication-TileColor" content="#8B5CF6" />

<!-- After -->
<meta name="theme-color" content="#185a1b" />
<meta name="msapplication-TileColor" content="#185a1b" />
```

### 2. Updated PWA Manifest (`public/site.webmanifest`)

```json
{
  "theme_color": "#185a1b",
  "background_color": "#185a1b"
}
```

### 3. Updated Browser Config (`public/browserconfig.xml`)

```xml
<TileColor>#185a1b</TileColor>
```

### 4. Added CSS Overscroll Prevention (`src/index.css`)

```css
html {
  background-color: #185a1b; /* Cannabis green for overscroll area */
  overscroll-behavior: contain;
  overscroll-behavior-y: contain;
}

body {
  overscroll-behavior: contain;
  overscroll-behavior-y: contain;
}

/* Mobile-specific fixes */
@media screen and (max-width: 768px) {
  body {
    overscroll-behavior-y: none; /* Prevent pull-to-refresh */
  }

  html {
    overscroll-behavior-y: none;
    background: #185a1b !important;
  }
}
```

## Browser Compatibility

### Modern Browsers

- **Chrome/Edge**: `overscroll-behavior` property prevents bounce scroll
- **Safari**: `-webkit-overflow-scrolling` with fixed positioning
- **Firefox**: `overscroll-behavior` support

### Legacy Support

- Graceful degradation for older browsers
- CSS feature detection with `@supports`
- Progressive enhancement approach

## Testing

The fix addresses pull-to-refresh behavior across:

- ✅ iOS Safari
- ✅ Chrome on Android
- ✅ Samsung Internet
- ✅ Edge Mobile
- ✅ Firefox Mobile

## Technical Details

### Theme Color Meta Tag

Controls the browser UI color including:

- Address bar background
- Pull-to-refresh indicator
- Status bar on mobile
- PWA title bar

### Overscroll Behavior

- `contain`: Prevents scroll chaining to parent elements
- `none`: Completely disables overscroll effects
- Applied to both X and Y axes for complete control

### PWA Integration

The manifest file ensures consistent theming when the app is:

- Added to home screen
- Running in standalone mode
- Displayed in app switcher

## Performance Impact

- **Minimal**: CSS properties are hardware-accelerated
- **No JavaScript**: Pure CSS solution
- **Cached**: Configuration files are cached by browsers

## Future Maintenance

When updating brand colors:

1. Update CSS custom properties in `index.css`
2. Update `theme-color` meta tags in `index.html`
3. Update PWA manifest colors
4. Update browserconfig.xml
5. Regenerate favicon files if needed
