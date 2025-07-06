# Admin Dashboard Setup Guide

## Quick Start - Flexible Admin System

The admin system now supports multiple administrators with role-based permissions instead of a single hardcoded email.

### Step 1: Run Database Migrations

You have two options for running the migrations:

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run each migration file in order:
   - `20241201000001_create_core_tables.sql`
   - `20241201000002_create_checkout_tables.sql`
   - `20241201000003_seed_sample_data.sql` (optional)
   - `20241201000004_create_admin_roles.sql`
   - `20241201000005_create_user_tables.sql`
   - `20241201000006_flexible_admin_system.sql` (NEW)

#### Option B: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

### Step 2: Create the First Super Admin

1. Go to your website: `http://localhost:5173` (or your deployed URL)
2. Click "Sign In" in the header
3. Click "Sign Up" tab
4. Create an account with any email address
5. Complete the sign-up process

### Step 3: Manually Grant Super Admin Access (First Time Only)

Since there are no admins yet, you'll need to manually create the first super admin:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Run this query (replace with your actual email):

```sql
-- First, find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then insert admin record (replace USER_ID with the ID from above)
INSERT INTO public.admins (user_id, email, role, permissions, is_active)
VALUES (
  'USER_ID_HERE',
  'your-email@example.com',
  'super_admin',
  '{"orders": true, "products": true, "users": true, "analytics": true, "settings": true, "admins": true}'::jsonb,
  true
);
```

### Step 4: Access Admin Dashboard

1. After setting up the super admin
2. Navigate to: `http://localhost:5173/admin`
3. You'll see the admin dashboard with all features

### Step 5: Add More Admins (Via UI)

As a super admin, you can now:
1. Go to the "Admins" tab in the dashboard
2. Click "Add Admin"
3. Enter the email of an existing user
4. Select their role (Admin or Super Admin)
5. They'll have access immediately

## Admin Roles

### Super Admin
- Full access to all features
- Can manage other admins
- Can change admin roles
- Can deactivate admin accounts

### Admin
- Access to all features except admin management
- Cannot add/remove other admins
- Cannot change roles

## Important Security Notes

- **Multiple admins supported**: No more single hardcoded email
- **Role-based access control**: Different permission levels
- **Secure by default**: RLS policies prevent unauthorized access
- **Audit trail**: All admin actions are logged

## Troubleshooting

### "Access Denied" when trying to access /admin

1. Make sure you're signed in
2. Check that your user exists in the `admins` table
3. Verify `is_active` is set to `true`
4. Clear your browser cache and cookies
5. Sign out and sign back in

### Can't Add New Admins

1. Verify you have `super_admin` role
2. Make sure the user you're adding has an account
3. Check browser console for errors

### Migrations Failed

If a migration fails:
1. Check you're running them in the correct order
2. Look for any error messages in Supabase logs
3. Ensure all previous migrations completed successfully

## Production Deployment

When deploying to production:

1. Run all migrations including the new admin system
2. Create your first super admin account
3. Use the SQL query method to grant super admin access
4. Test admin access before going live
5. Add additional admins through the UI

## Admin Management Best Practices

1. **Limit Super Admins**: Only trusted personnel should have super admin access
2. **Regular Audits**: Review admin list periodically
3. **Deactivate vs Delete**: Deactivate admins instead of deleting for audit trail
4. **Strong Passwords**: Enforce strong passwords for all admin accounts
5. **Monitor Activity**: Check admin activity logs regularly

## API Reference

### Database Functions

- `is_admin_user(user_id)` - Check if user is an admin
- `get_admin_role(user_id)` - Get user's admin role
- `get_admin_permissions(user_id)` - Get user's permissions

### Admin Table Structure

```sql
admins
├── id (UUID, primary key)
├── user_id (UUID, references auth.users)
├── email (TEXT, unique)
├── role (TEXT: 'admin' or 'super_admin')
├── permissions (JSONB)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMPTZ)
├── updated_at (TIMESTAMPTZ)
└── created_by (UUID, references auth.users)
```

## Need Help?

- Check the console for error messages
- Review the Supabase logs for database errors
- Ensure RLS is enabled on all tables
- Verify your environment variables are set correctly 