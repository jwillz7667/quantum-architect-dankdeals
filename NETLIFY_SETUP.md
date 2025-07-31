# Netlify Environment Variables Setup

## Required Environment Variables

To make the product images work correctly in production, you **MUST** set these environment variables in your Netlify dashboard:

### 1. Go to Netlify Dashboard

1. Log in to your Netlify account
2. Select your site (dankdealsmn)
3. Go to **Site configuration** → **Environment variables**

### 2. Add These Variables

Click "Add a variable" and add each of these:

#### Supabase Configuration (REQUIRED)

```
VITE_SUPABASE_URL = https://ralbzuvkyexortqngvxs.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbGJ6dXZreWV4b3J0cW5ndnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTk3NzEsImV4cCI6MjA2Njk3NTc3MX0.QRWwsrZGHY4HLFOlRpygtJDDd1DAJ2rBwDOt1e1m-sA
```

#### Optional Variables

```
VITE_ADMIN_EMAIL = admin@dankdealsmn.com
VITE_SITE_URL = https://dankdealsmn.com
```

### 3. Deploy Settings

After adding the variables:

1. Click "Save"
2. Go to **Deploys** tab
3. Click **Trigger deploy** → **Clear cache and deploy site**

This will rebuild your site with the proper environment variables.

## Why This Is Required

- The Supabase URL and key are needed to fetch product images from Supabase Storage
- Without these variables, the app will use mock data with broken image URLs
- The variables are kept in Netlify (not in code) for security

## Troubleshooting

If images still don't load after setting variables:

1. Check browser console for errors
2. Verify the Supabase project is active and not paused
3. Ensure the products storage bucket is public
4. Clear browser cache and Service Worker
