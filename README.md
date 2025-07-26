# DankDeals - Cannabis Delivery E-commerce Platform

## 🔴 IMPORTANT: Admin Dashboard Setup

**Admin access is restricted to: `admin@dankdealsmn.com`**

See `ADMIN_SETUP_GUIDE.md` for detailed instructions on:
- Running database migrations
- Creating the admin account  
- Accessing the admin dashboard at `/admin`

## Project Overview

DankDeals is a comprehensive cannabis delivery e-commerce platform built with React, TypeScript, and Supabase. Features include:

### 🛒 **E-commerce Core**
- Product catalog with categories and variants
- Advanced search and filtering
- Shopping cart with persistent storage
- Real-time inventory management

### 👤 **User Profile System**
- Complete user profile management
- Order history with tracking and filtering
- Address book with multiple delivery addresses
- Security settings with password management
- Notification preferences with granular controls

### 🔐 **Authentication & Security**
- Multi-provider OAuth (Google, Apple, Facebook)
- Age verification (21+)
- Protected routes and user sessions
- Row-level security (RLS) policies

### 🚚 **Order & Delivery**
- Delivery zone management (Minneapolis area)
- Cash-on-delivery payment system
- Order tracking and status updates
- Delivery address management

### 📊 **Admin Features**
- Real-time analytics dashboard
- Product and inventory management
- Order processing and tracking
- User and sales analytics

### 📱 **User Experience**
- Mobile-responsive design
- Progressive Web App (PWA) capabilities
- Real-time updates and notifications
- SEO-optimized with structured data

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **Forms**: React Hook Form, Zod validation
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Query, Context API
- **Authentication**: Supabase Auth (Google, Apple, Facebook OAuth)
- **Database**: PostgreSQL with Row Level Security
- **Build Tool**: Vite
- **Deployment**: Vercel/Lovable

## Quick Start

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd quantum-architect-dankdeals

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials to .env.local

# Run database migrations (see ADMIN_SETUP_GUIDE.md)

# Start development server
npm run dev
```

## Environment Variables

Create a `.env.local` file with:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Key Features

### 🏠 **Customer Portal**
- **Homepage**: Product showcase and featured items
- **Product Catalog**: Browse by categories with advanced filtering
- **Product Details**: Comprehensive product information with variants
- **Shopping Cart**: Persistent cart with quantity management
- **User Profile**: Complete account management system

### 👤 **Profile System** (New!)
Access your profile at `/profile` after logging in:

- **Profile Info**: Edit personal information and preferences
- **Order History**: View and track all your orders with detailed filtering
- **Address Book**: Manage multiple delivery addresses
- **Security**: Change password and manage account security
- **Notifications**: Customize email, SMS, and push notification preferences

### 🛒 **Shopping Experience**
- **Categories**: `/categories` - Browse all product categories
- **Cart**: `/cart` - Review items before checkout
- **Checkout Flow**: Multi-step checkout with address and payment
- **Order Tracking**: Real-time order status updates

### 🔐 **Authentication**
- **Login**: `/auth/login` - Multiple OAuth providers
- **Register**: `/auth/register` - Quick account creation
- **Password Reset**: `/auth/forgot-password`
- **OAuth Callback**: `/auth/callback` - Handle OAuth returns

### 📊 **Admin Dashboard**
Access the admin dashboard at `/admin` after logging in as an admin user:
- **Overview**: `/admin` - Analytics and key metrics
- **Manage Products**: `/admin/products` - Product and inventory management
- **Manage Orders**: `/admin/orders` - Order processing and tracking

Ensure your user has `is_admin: true` in Supabase.

## Database Setup

The database schema includes comprehensive tables for:
- **Users & Profiles**: User information and preferences
- **Products & Variants**: Product catalog with pricing tiers
- **Orders & Order Items**: Complete order management
- **Addresses**: Multiple delivery addresses per user
- **Cart Items**: Persistent shopping cart
- **Admin Features**: Notifications and settings

Run the migrations in order through Supabase SQL Editor:

1. `supabase/migrations/20250124000000_create_base_schema.sql` - Core tables
2. `supabase/migrations/20250125000000_setup_auth_triggers.sql` - Auth setup
3. `supabase/migrations/20250126000000_order_email_trigger.sql` - Email triggers
4. `supabase/migrations/20250127000000_email_logging_tables_v2.sql` - Email logging
5. `supabase/migrations/20250128000000_enable_guest_orders.sql` - Guest checkout

**Admin Dashboard Migrations** (if needed):
- `supabase/migrations/20250703000000-cleanup.sql` (if you get column errors)
- `supabase/migrations/20250703000000-admin-dashboard.sql`
- `supabase/migrations/20250703000001-store-settings.sql`
- `supabase/migrations/20250703000002-admin-notifications.sql`
- `supabase/migrations/20250703000003-setup-admin-user.sql`

## Development

```bash
# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Lovable Platform
Open [Lovable](https://lovable.dev/projects/d9bfb677-34d0-4e69-814d-fdaf7e736d6b) and click Share → Publish

### Vercel
1. Connect your GitHub repository
2. Add environment variables
3. Deploy

## Legal Compliance

- 21+ age verification required
- Minnesota cannabis delivery regulations
- Cash-only transactions
- Delivery zones limited to Minneapolis area

## Recent Updates

### 🎉 **New Profile System** (Latest)
- Complete user profile management with tabbed navigation
- Order history with advanced filtering and search
- Address book with multiple delivery addresses
- Security settings with password management
- Notification preferences with granular controls
- Mobile-responsive design with bottom navigation

### 🔐 **Enhanced Authentication**
- Facebook OAuth provider added (alongside Google and Apple)
- Improved OAuth flow and error handling
- Better user session management

### 💰 **Updated Pricing Structure**
- 1/8 oz: $40
- 1/4 oz: $75  
- 1/2 oz: $140
- 1 oz: $250

### 🔍 **SEO Improvements**
- Enhanced structured data for better Google Search Console compliance
- Multiple variant offers in product schema
- Improved meta tags and OpenGraph data

## Support

- Admin Email: admin@dankdealsmn.com
- Documentation: See `ADMIN_DASHBOARD_README.md`
- Setup Guide: See `ADMIN_SETUP_GUIDE.md`
- Profile System: Full user account management at `/profile`

## License

Proprietary - All rights reserved
