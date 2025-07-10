# Production Troubleshooting Guide

## Common Issues and Solutions

### 1. White Screen of Death

**Symptoms**: The page loads but shows only a white screen with no content.

**Common Causes & Solutions**:

#### Missing Environment Variables

- **Check**: Browser console for "Missing required Supabase configuration" errors
- **Solution**: Ensure all required environment variables are set in Netlify:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

#### JavaScript Bundle Errors

- **Check**: Browser console for errors like `__name is not a function`
- **Solution**: This has been fixed by:
  - Adding polyfills in `index.html`
  - Updating build target to ES2018
  - Preserving function names during minification

#### Build/Minification Issues

- **Check**: Browser console for syntax errors or undefined variables
- **Solution**:
  - Clear Netlify build cache: Deploy settings → Clear cache and deploy site
  - Ensure latest dependencies: Delete `node_modules` and `package-lock.json`, then reinstall

### 2. Authentication Issues

**Symptoms**: Users can't sign in, getting "Invalid Refresh Token" errors

**Common Causes & Solutions**:

- **Expired tokens**: Normal behavior, users need to sign in again
- **Supabase configuration**: Verify Supabase project is active and keys are correct
- **CORS issues**: Check Supabase dashboard for allowed URLs

### 3. Performance Issues

**Symptoms**: Slow page loads, poor Lighthouse scores

**Solutions**:

- Enable caching headers (already configured in `_headers`)
- Use production build (`npm run build`)
- Check bundle sizes: `npm run analyze`

### 4. Debugging Production Issues

#### 1. Check Browser Console

- Open DevTools (F12)
- Look for errors in Console tab
- Check Network tab for failed requests

#### 2. View Netlify Build Logs

- Go to Netlify dashboard → Deploys
- Click on the latest deploy
- Review build logs for errors

#### 3. Test Locally with Production Build

```bash
# Build for production
npm run build

# Test production build locally
npm run preview
```

#### 4. Environment Variable Verification

In browser console, check if environment is loaded:

```javascript
// Should see environment status logged
// Look for: "Environment check: { hasSupabaseUrl: true, hasSupabaseKey: true, environment: 'production' }"
```

### 5. Quick Fixes

#### Clear Browser Cache

- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear site data: DevTools → Application → Clear Storage

#### Force Netlify Rebuild

1. Go to Netlify dashboard
2. Deploy settings → Build & deploy
3. Trigger deploy → Clear cache and deploy site

#### Rollback to Previous Version

1. Go to Netlify dashboard → Deploys
2. Find a working deploy
3. Click "Publish deploy"

### 6. Emergency Contacts

- **Technical Issues**: Check error messages in browser console first
- **Supabase Issues**: Check Supabase dashboard status
- **Netlify Issues**: Check Netlify status page

### 7. Prevention

1. **Always test locally before deploying**:

   ```bash
   npm run build && npm run preview
   ```

2. **Monitor deployments**:
   - Check Netlify deploy logs
   - Test immediately after deployment

3. **Use preview deployments**:
   - Test pull requests in preview URLs before merging
