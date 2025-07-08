# Netlify Build Fix Documentation

## Issue

The Netlify build was failing with the error:

```
Error: Failed to Obfuscate '/opt/build/repo/dist/assets/checkout-vendor-zXMl-M9N.js'
Unknown node type StaticBlock.
```

## Root Cause

The `netlify-plugin-js-obfuscator` plugin (v1.0.20) cannot parse ES2022+ JavaScript features, specifically static blocks in classes.

## Solution Implemented

### 1. Build Target Adjustment

Changed Vite build targets from `esnext`/`es2020` to `es2015` in `vite.config.ts`:

- `build.target: 'es2015'`
- `esbuild.target: 'es2015'`
- `optimizeDeps.esbuildOptions.target: 'es2015'`

This ensures the output JavaScript is compatible with the obfuscator plugin.

### 2. Netlify Configuration

Created `netlify.toml` with:

- Proper build commands and publish directory
- Security headers (X-Frame-Options, CSP, etc.)
- Cache control for optimal performance
- SPA redirect rules

## Action Required

### Option 1: Keep the Obfuscator (Current Solution)

The build should now work with the ES2015 target. No action needed.

### Option 2: Remove the Obfuscator (Recommended)

Since we already use esbuild minification, the obfuscator adds minimal security value:

1. Go to Netlify Dashboard → Site Settings → Build & Deploy → Environment
2. Find and remove `netlify-plugin-js-obfuscator` from the plugins list
3. Redeploy the site

After removing the plugin, you can optionally revert to modern build targets:

- Change all `es2015` targets back to `esnext` in `vite.config.ts`
- This will reduce bundle sizes and improve performance

## Bundle Size Impact

Using ES2015 target increases bundle sizes slightly:

- Before: ~527KB vendor bundle
- After: ~594KB vendor bundle (estimated ~12% increase)

## Security Considerations

- esbuild minification provides code obfuscation
- Security headers in netlify.toml enhance protection
- True security comes from server-side validation, not client-side obfuscation
