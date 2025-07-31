# Google Maps Setup Guide

## Important Security Notice

Google Maps is **disabled by default** in production builds to prevent API key exposure. The static fallback UI will be shown instead.

## Why is Google Maps Disabled?

Google Maps API keys can be exposed in client-side JavaScript bundles, which poses a security risk. To protect your API keys, we've disabled Google Maps in production builds by default.

## How to Enable Google Maps (Not Recommended)

If you absolutely need Google Maps in production, you must:

1. **Create a restricted API key** in the Google Cloud Console
2. **Add HTTP referrer restrictions** to only allow your domain
3. **Enable only the required APIs** (Maps JavaScript API, Places API)
4. **Set a quota limit** to prevent abuse

## Recommended Alternative

Instead of using Google Maps directly, consider:

1. **Static maps images** - Use Google Static Maps API server-side
2. **OpenStreetMap** - Free, open-source alternative
3. **Mapbox** - More secure implementation options
4. **Server-side proxy** - Keep API key on server only

## Development Setup

For local development, you can still use Google Maps:

1. Copy `.env.example` to `.env`
2. Add your API key: `VITE_GOOGLE_MAPS_API_KEY=your_actual_key`
3. The map will work in development mode

## Production Configuration

The `netlify.toml` file explicitly sets:

```toml
VITE_GOOGLE_MAPS_API_KEY = "DISABLED_FOR_SECURITY"
```

This ensures Google Maps is disabled in production builds, preventing API key exposure.

## Static Fallback UI

When Google Maps is disabled, users see:

- Delivery coverage area information
- List of supported cities
- Contact information
- Professional appearance without security risks
