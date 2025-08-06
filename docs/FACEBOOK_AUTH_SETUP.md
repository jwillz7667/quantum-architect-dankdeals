# Facebook Authentication Setup Guide

## Overview

This guide will help you configure Facebook OAuth authentication for DankDeals. The code implementation is already complete - you just need to configure Facebook App and Supabase settings.

## Prerequisites

- Access to Supabase Dashboard
- Facebook Developer Account
- Your production domain (e.g., https://dankdealsmn.com)

## Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Consumer" as the app type
4. Fill in the app details:
   - **App Name**: DankDeals MN
   - **App Contact Email**: admin@dankdealsmn.com
   - **App Purpose**: Business

## Step 2: Configure Facebook Login

1. In your Facebook App Dashboard:
   - Go to "Add Product" → Find "Facebook Login" → Click "Set Up"
   - Choose "Web" platform
   - Enter your Site URL: `https://dankdealsmn.com`

2. Go to Facebook Login → Settings:
   - **Valid OAuth Redirect URIs**: Add these URLs:
     ```
     https://ralbzuvkyexortqngvxs.supabase.co/auth/v1/callback
     http://localhost:8080/auth/callback
     https://dankdealsmn.com/auth/callback
     ```
   - **Deauthorize Callback URL**: `https://dankdealsmn.com/auth/deauthorize`
   - **Data Deletion Request URL**: `https://dankdealsmn.com/auth/delete`
   - Enable these settings:
     - ✅ Client OAuth Login
     - ✅ Web OAuth Login
     - ✅ Use Strict Mode for Redirect URIs
     - ✅ Enforce HTTPS

3. Go to Settings → Basic:
   - Copy your **App ID**
   - Copy your **App Secret** (click "Show")
   - Add your domains:
     - App Domains: `dankdealsmn.com`
     - Privacy Policy URL: `https://dankdealsmn.com/privacy`
     - Terms of Service URL: `https://dankdealsmn.com/terms`

## Step 3: Configure Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (ralbzuvkyexortqngvxs)
3. Go to Authentication → Providers
4. Find "Facebook" and click "Enable"
5. Enter your Facebook credentials:
   - **Facebook App ID**: (paste from Step 2.3)
   - **Facebook App Secret**: (paste from Step 2.3)
6. Copy the Redirect URL shown (should be: `https://ralbzuvkyexortqngvxs.supabase.co/auth/v1/callback`)
7. Click "Save"

## Step 4: App Review & Permissions

### Required Permissions

For basic authentication, you need:

- `email` (already requested in code)
- `public_profile` (default permission)

### For Production Release

1. In Facebook App Dashboard → App Review → Permissions and Features
2. Request and get approval for:
   - `email` permission (if not automatically granted)

3. Switch your app to "Live" mode:
   - Go to the top of the dashboard
   - Toggle from "Development" to "Live"
   - Confirm the switch

## Step 5: Test the Integration

### Local Testing

1. Ensure your app is in "Development" mode in Facebook
2. Add test users: App Roles → Test Users
3. Run the app locally: `npm run dev`
4. Try signing in with Facebook

### Production Testing

1. Switch app to "Live" mode
2. Visit https://dankdealsmn.com/auth/login
3. Click "Continue with Facebook"
4. Authorize the app
5. Verify successful redirect and login

## Troubleshooting

### Common Issues

#### "URL Blocked" Error

- Ensure all redirect URLs are added in Facebook Login Settings
- Check that HTTPS is enforced
- Verify domain is added in App Settings

#### "App Not Set Up" Error

- Make sure the app is in "Live" mode for production
- Verify all required fields in Basic Settings are filled

#### No Email Returned

- Ensure `email` permission is requested
- User might not have an email associated with their Facebook account
- Check if user has granted email permission

### Debug Tools

1. Facebook Login Debugger: https://developers.facebook.com/tools/debug/
2. Access Token Debugger: https://developers.facebook.com/tools/debug/accesstoken/
3. Supabase Logs: Dashboard → Logs → Auth

## Security Considerations

1. **Never commit credentials**: Keep App Secret secure
2. **Use environment variables**: Store in Supabase Dashboard, not in code
3. **HTTPS only**: Always use HTTPS in production
4. **Validate tokens**: Let Supabase handle token validation
5. **Privacy compliance**: Ensure GDPR/CCPA compliance for user data

## Data Handling

When users sign in with Facebook, we receive:

- User ID (Facebook ID)
- Name
- Email (if permission granted)
- Profile picture URL

This data is stored in Supabase auth.users table and can be accessed via:

```javascript
const user = supabase.auth.user();
const facebookData = user?.user_metadata;
```

## Support Links

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/web)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-facebook)
- [Facebook App Dashboard](https://developers.facebook.com/apps/)
- [Supabase Dashboard](https://app.supabase.com)

## Next Steps

After setup is complete:

1. Test with multiple user accounts
2. Monitor error rates in Supabase logs
3. Set up Facebook Analytics (optional)
4. Configure Facebook Pixel for conversion tracking (optional)
