# Netlify Configuration Guide

## Quick Start

1. **Remove the problematic plugin**:
   - Go to Netlify Dashboard → Site Settings → Plugins
   - Remove `netlify-plugin-js-obfuscator` if present
   - This plugin causes build failures with modern JavaScript

2. **Deploy**:
   - The `netlify.toml` file is already configured and ready
   - Push to your repository and Netlify will use these settings automatically

## Configuration Features

### 🔒 Security Headers

- **CSP (Content Security Policy)**: Protects against XSS attacks
- **HSTS**: Forces HTTPS connections
- **X-Frame-Options**: Prevents clickjacking
- **Permissions Policy**: Disables unwanted browser features

### ⚡ Performance

- **Static Asset Caching**: 1 year cache for JS/CSS/fonts
- **Image Caching**: 1 day cache with stale-while-revalidate
- **Compression**: Automatic CSS/JS/HTML compression
- **Build Optimization**: ES2015 target for compatibility

### 🔄 Redirects

- **SPA Support**: All routes redirect to index.html
- **Domain Redirects**: www → non-www, Netlify subdomain → custom domain
- **Old URLs**: /shop and /products → /categories

### 🛠️ Build Contexts

- **Production**: `VITE_ENV=production`
- **Preview**: `VITE_ENV=preview` for pull requests
- **Staging**: `VITE_ENV=staging` for branch deploys
- **Development**: `VITE_ENV=development` for dev branch

## Optional Plugins

Uncomment in `netlify.toml` to enable:

1. **Lighthouse** - Performance monitoring
2. **Submit Sitemap** - Auto-submit to Google/Bing
3. **Image Optimization** - Compress images during build
4. **Check Links** - Find broken links

## Environment Variables

Add these in Netlify UI (Site Settings → Environment Variables):

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PLAUSIBLE_DOMAIN=dankdealsmn.com
```

## Troubleshooting

### Build Failures

1. Check if `netlify-plugin-js-obfuscator` is removed
2. Verify Node version is 18 in build logs
3. Check environment variables are set

### Performance Issues

1. Review Lighthouse scores in build logs (if plugin enabled)
2. Check cache headers in Network tab
3. Verify static assets are being cached

### Security Warnings

1. CSP may block some third-party scripts
2. Adjust CSP in netlify.toml if needed
3. Test thoroughly after CSP changes

## Next Steps

1. Deploy and verify build succeeds
2. Test all redirects work correctly
3. Check security headers at [securityheaders.com](https://securityheaders.com)
4. Monitor Core Web Vitals in Google Search Console
5. Enable desired plugins one at a time
