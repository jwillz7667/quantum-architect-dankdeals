# Admin Dashboard Setup Guide

## Quick Start - Accessing the Admin Dashboard

### Step 1: Run Database Migrations

You have two options for running the migrations:

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor

**⚠️ If you get errors about columns not existing:**
- First run: `20250703000000-cleanup.sql` (this removes any existing tables with wrong schemas)

3. Then run each migration file in order:
   - First: `20250703000000-admin-dashboard.sql`
   - Second: `20250703000001-store-settings.sql`
   - Third: `20250703000002-admin-notifications.sql`
   - Fourth: `20250703000003-setup-admin-user.sql`

#### Option B: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

### Step 2: Create Admin Account

1. Go to your website: `http://localhost:5173` (or your deployed URL)
2. Click "Sign In" in the header
3. Click "Sign Up" tab
4. Create an account with the email: **`admin@dankdealsmn.com`**
5. Use a strong password
6. Complete the sign-up process

### Step 3: Access Admin Dashboard

1. After signing up/in with `admin@dankdealsmn.com`
2. Navigate to: `http://localhost:5173/admin`
3. You'll see the admin dashboard

**Note:** Only `admin@dankdealsmn.com` can access the admin panel. Any other email will be redirected.

## Important Security Notes

- **Only one admin email:** `admin@dankdealsmn.com`
- This email is hardcoded for security
- The database has constraints to prevent other emails from having admin role
- Store email is also set to `admin@dankdealsmn.com`

## Troubleshooting

### "Access Denied" when trying to access /admin

1. Make sure you're signed in with `admin@dankdealsmn.com`
2. Check that all migrations have run successfully
3. Clear your browser cache and cookies
4. Sign out and sign back in

### Migrations Failed

If a migration fails, check:
1. You're running them in the correct order
2. No duplicate constraints exist
3. The Supabase project has the required extensions enabled

**Common Error: "column does not exist"**

If you get an error like `column "zip_code" of relation "delivery_zones" does not exist`, it means tables from a previous attempt exist with different schemas. The migration now handles this by dropping and recreating tables.

**Solution:** Just run the migration again - it will drop the old tables and create them with the correct schema.

### Can't Sign Up

1. Make sure your Supabase project is configured correctly
2. Check that email confirmations are disabled for development:
   - Go to Supabase Dashboard > Authentication > Settings
   - Disable "Enable email confirmations" for local development

## Production Deployment

When deploying to production:

1. Ensure all environment variables are set:
   ```
   VITE_SUPABASE_URL=your_production_url
   VITE_SUPABASE_ANON_KEY=your_production_anon_key
   ```

2. Run migrations on production database

3. Enable email confirmations in Supabase for security

4. Use a strong password for the admin account

5. Enable 2FA when available

## Admin Dashboard Features

Once logged in, you'll have access to:

- **Dashboard Overview** - Real-time metrics and analytics
- **Order Management** - Process and track orders
- **Product Management** - Manage inventory
- **User Management** - View and manage customers
- **Analytics** - Business insights and trends
- **Activity Logs** - Audit trail of admin actions
- **Reports** - Generate business reports
- **Settings** - Configure store settings

## Need Help?

- Email: admin@dankdealsmn.com
- Check the console for error messages
- Review the Supabase logs for database errors 