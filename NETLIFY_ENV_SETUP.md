# Netlify Environment Variables Setup Guide

## Required Environment Variables

The application requires the following environment variables to be set in Netlify:

### 1. **VITE_SUPABASE_URL** (Required)

- Your Supabase project URL
- Format: `https://[PROJECT_ID].supabase.co`
- Example: `https://vtjlnkcvzydgmqfqgsgx.supabase.co`

### 2. **VITE_SUPABASE_ANON_KEY** (Required)

- Your Supabase anonymous/public key
- This is safe to expose in the frontend
- Found in Supabase Dashboard > Settings > API

### 3. **VITE_ADMIN_EMAIL** (Optional)

- Admin email for the application
- Default: `admin@dankdealsmn.com`

### 4. **VITE_ENV** (Optional)

- Environment name: `development`, `staging`, or `production`
- Default: `production`

### 5. **VITE_PLAUSIBLE_DOMAIN** (Optional)

- Your domain for Plausible Analytics
- Example: `dankdealsmn.com`

### 6. **VITE_SENTRY_DSN** (Optional)

- Sentry DSN for error tracking
- Format: `https://[KEY]@[ORG].ingest.sentry.io/[PROJECT_ID]`

## How to Set Environment Variables in Netlify

1. **Log into Netlify Dashboard**
   - Go to https://app.netlify.com
   - Select your site

2. **Navigate to Environment Variables**
   - Go to Site Settings → Environment Variables
   - OR: Site Settings → Build & Deploy → Environment

3. **Add Variables**
   - Click "Add a variable"
   - Enter the key (e.g., `VITE_SUPABASE_URL`)
   - Enter the value
   - Select scope (usually "Production" and "Preview")
   - Click "Create variable"

4. **Trigger a Redeploy**
   - After adding all variables, go to Deploys
   - Click "Trigger deploy" → "Deploy site"

## Debugging Production Issues

If you're getting a white screen in production:

1. **Check Browser Console**
   - Open browser DevTools (F12)
   - Look for error messages in Console tab
   - Check Network tab for failed requests

2. **Verify Environment Variables**
   - In Netlify dashboard, check all required variables are set
   - Ensure no typos in variable names
   - Verify values don't contain placeholder text like "your-project"

3. **Check Build Logs**
   - In Netlify dashboard, go to Deploys
   - Click on the latest deploy
   - Review build logs for any errors

4. **Common Issues**
   - Missing VITE\_ prefix on variables
   - Using wrong Supabase project URL or key
   - Incorrect URL format (missing https://)
   - Variables set but not deployed (need to redeploy)

## Testing Locally with Production Variables

Create a `.env.production.local` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_EMAIL=admin@dankdealsmn.com
VITE_ENV=production
```

Then run:

```bash
npm run build
npm run preview
```

This will test the production build locally with your environment variables.
