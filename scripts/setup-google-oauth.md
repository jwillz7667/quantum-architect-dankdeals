# Google OAuth Setup Instructions

## 1. Google Cloud Console Configuration

You need to update your Google OAuth configuration in Google Cloud Console:

### Authorized JavaScript Origins

Add these to your Google OAuth client:

- `https://dankdealsmn.com`
- `https://ralbzuvkyexortqngvxs.supabase.co` (your Supabase domain)

### Authorized Redirect URIs

Add these to your Google OAuth client:

- `https://ralbzuvkyexortqngvxs.supabase.co/auth/v1/callback`
- `https://dankdealsmn.com/auth/callback`

## 2. Supabase Dashboard Configuration

Log into your Supabase dashboard at https://supabase.com/dashboard and:

1. Go to Authentication > Settings
2. Set Site URL to: `https://dankdealsmn.com`
3. Add these Additional Redirect URLs:
   - `https://dankdealsmn.com/auth/callback`
   - `http://localhost:8082/auth/callback` (for local development)

4. Go to Authentication > Providers
5. Enable Google provider
6. Set Google Client ID: `[YOUR_GOOGLE_CLIENT_ID]`
7. Set Google Client Secret: `[YOUR_GOOGLE_CLIENT_SECRET]`

## 3. Environment Variables

Make sure these are set in your production environment (Netlify):

```
GOOGLE_CLIENT_SECRET=[YOUR_GOOGLE_CLIENT_SECRET]
```

## 4. Common Issues

- **400 Bad Request**: Usually means redirect URI mismatch
- **Invalid OAuth client**: Client ID/Secret mismatch
- **Access blocked**: Google hasn't approved your OAuth consent screen

## 5. Testing

After configuration:

1. Test on production: https://dankdealsmn.com/auth/login
2. Click "Continue with Google"
3. Should redirect to Google OAuth consent screen
4. After consent, should redirect back to your app
