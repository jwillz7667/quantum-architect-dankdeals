# Custom Domain OAuth Setup with auth.dankdealsmn.com

Now that you have a custom domain configured in Supabase, here's what you need to update:

## 1. Environment Variables

Update these in your Netlify dashboard:

```
VITE_SUPABASE_URL=https://auth.dankdealsmn.com
```

## 2. Google Cloud Console Updates

Update your OAuth 2.0 Client ID settings:

### Authorized JavaScript Origins:

- `https://dankdealsmn.com`
- `https://auth.dankdealsmn.com`

### Authorized Redirect URIs:

- `https://auth.dankdealsmn.com/auth/v1/callback`
- `https://dankdealsmn.com/auth/callback`

## 3. Supabase Dashboard Settings

In your Supabase Dashboard (Authentication > Settings):

- **Site URL**: `https://dankdealsmn.com`
- **Additional Redirect URLs**:
  - `https://dankdealsmn.com/auth/callback`
  - `http://localhost:8082/auth/callback`

## 4. DNS Configuration

Make sure your DNS is properly configured:

- `auth.dankdealsmn.com` should have a CNAME pointing to your Supabase project

## Benefits

With this setup:

- Users will see "Sign in to auth.dankdealsmn.com" instead of the Supabase URL
- Looks more professional and trustworthy
- Maintains your brand consistency

## Testing

After all updates:

1. Clear your browser cache
2. Try signing in with Google at https://dankdealsmn.com/auth/login
3. The consent screen should now show your custom domain
