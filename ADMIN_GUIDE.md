# Admin Panel Guide

## Overview

The Dank Deals admin panel is built with React-Admin and provides a comprehensive interface for managing products, categories, orders, and users.

## Accessing the Admin Panel

1. Navigate to `/admin` on your website
2. Login with your admin credentials
3. Only users with the `admin` role can access the panel

## Creating an Admin User

### For Development

```bash
# Set up environment variables
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Create an admin user
node scripts/create-admin-user.js admin@example.com yourpassword
```

### For Production

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run this query to make an existing user an admin:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

## Features

### Dashboard

- Overview of total products, orders, users, and revenue
- Quick access to all resources
- Recent activity monitoring

### Product Management

- **List Products**: View all products with filtering and sorting
- **Create Product**: Add new products with images
- **Edit Product**: Update product details and images
- **Delete Product**: Remove products from the catalog
- **Bulk Operations**: Delete multiple products at once

### Category Management

- Create and manage product categories
- Edit category names and descriptions
- Organize products by category

### Order Management

- View all orders with status tracking
- Filter orders by status and date
- View detailed order information
- Track customer information

### Image Upload

- Drag-and-drop image upload
- Automatic image optimization
- Support for WebP format
- Secure storage in Supabase

## Security

### Role-Based Access Control

- Only users with `admin` role can access the panel
- Row Level Security (RLS) policies protect data
- All actions are validated server-side

### Audit Trail

- Admin actions are logged in the `admin_actions` table
- Track who made changes and when
- Monitor admin activity

## Best Practices

1. **Regular Backups**: Always backup your database before major changes
2. **Test Changes**: Test product changes in development first
3. **Monitor Performance**: Keep an eye on image sizes and load times
4. **Security**: Regularly review admin access and rotate credentials
5. **SEO**: Update product descriptions and metadata for better search visibility

## Troubleshooting

### Can't Access Admin Panel

1. Verify your user has the `admin` role
2. Check browser console for errors
3. Ensure you're logged in

### Image Upload Fails

1. Check file size (max 5MB)
2. Verify file format (PNG, JPG, JPEG, WebP)
3. Check Supabase storage bucket permissions

### Data Not Updating

1. Check browser network tab for errors
2. Verify RLS policies are correct
3. Clear browser cache and refresh

## Development

### Running Locally

```bash
npm run dev
# Navigate to http://localhost:5173/admin
```

### Adding New Resources

1. Create resource components in `src/admin/resources/`
2. Import and add to `src/admin/index.tsx`
3. Update RLS policies as needed

### Customizing Theme

Edit `src/admin/theme.ts` to match your brand colors and typography.

## Support

For issues or questions:

1. Check the [React-Admin documentation](https://marmelab.com/react-admin/)
2. Review Supabase logs for database errors
3. Contact your development team for assistance
