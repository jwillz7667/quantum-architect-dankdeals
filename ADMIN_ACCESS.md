# Admin Access Guide - DankDeals MN

## Overview
DankDeals MN includes a comprehensive admin dashboard for managing the cannabis delivery platform. Admin access is restricted to authorized personnel only.

## Admin Account Setup

### Default Admin Email
- **Email**: `admin@dankdealsmn.com`
- **Role**: Automatically assigned 'admin' role upon account creation

### How to Access Admin Dashboard

1. **Sign Up/Sign In** with the admin email address
2. **Navigate to Admin Dashboard** via any of these methods:
   - **Profile Page**: Visit `/profile` - Admin users will see an "Admin Dashboard" section
   - **Desktop Header**: Admin navigation link appears in the main navigation
   - **Mobile Header**: Admin dashboard link in the mobile menu
   - **Bottom Navigation**: "Admin" tab visible to admin users (mobile)
   - **Direct URL**: Navigate directly to `/admin`

### Admin Features

#### Navigation Access
- ✅ **Desktop Header**: Admin Dashboard link in main navigation
- ✅ **Mobile Header**: Admin Dashboard in mobile menu
- ✅ **Bottom Navigation**: Admin tab for mobile users
- ✅ **Profile Page**: Dedicated admin section with visual badges

#### Visual Indicators
- 🛡️ **Admin Badge**: Displayed next to name in profile
- 🎨 **Highlighted Links**: Admin links have special styling
- 📱 **Mobile-Friendly**: Full admin access on all device sizes

#### Dashboard Sections
- 📊 **Overview**: Key metrics and analytics
- 📦 **Orders**: Order management and tracking
- 🛍️ **Products**: Inventory and product management
- 👥 **Users**: Customer account management
- 📈 **Analytics**: Sales and performance data
- 📋 **Activity**: Admin action logging
- 📄 **Reports**: Business intelligence reports
- ⚙️ **Settings**: System configuration

## Security Features

### Authentication
- **Email Validation**: Only `admin@dankdealsmn.com` can access admin features
- **Role-Based Access**: Database-level role verification
- **Session Security**: Secure session management
- **Activity Logging**: All admin actions are logged

### Protection
- **Route Guards**: `AdminRoute` component protects all admin pages
- **Database Security**: Row Level Security (RLS) policies
- **Auto-Redirect**: Non-admin users redirected to home page
- **Rate Limiting**: Protection against brute force attacks

## Database Schema

### Admin User Profile
```sql
-- Admin profile automatically created with:
{
  "user_id": "uuid",
  "role": "admin",
  "first_name": "Admin", 
  "last_name": "User",
  "email": "admin@dankdealsmn.com"
}
```

### Permissions
- **Read/Write**: All products, vendors, orders
- **User Management**: View and manage customer accounts
- **System Settings**: Configure store operations
- **Analytics**: Access to all business metrics

## Troubleshooting

### Common Issues

1. **"Access Denied" Message**
   - Verify you're using `admin@dankdealsmn.com`
   - Check that your account has 'admin' role in database
   - Try signing out and back in

2. **Admin Links Not Visible**
   - Clear browser cache
   - Verify admin role in database
   - Check network connection

3. **Dashboard Not Loading**
   - Check browser console for errors
   - Verify database connection
   - Try refreshing the page

### Support
For technical issues with admin access, check the application logs or contact the development team.

## Development Notes

### File Locations
- `src/hooks/useAdminAuth.tsx` - Admin authentication logic
- `src/components/AdminRoute.tsx` - Route protection
- `src/pages/admin/` - Admin dashboard components
- `supabase/migrations/` - Database schema and permissions

### Key Components
- **AdminRoute**: Protects admin-only routes
- **useAdminAuth**: Manages admin authentication state
- **AdminDashboard**: Main admin interface
- **Profile Page**: Shows admin access options

---

*Last Updated: January 2025*
*Version: 1.0.0* 