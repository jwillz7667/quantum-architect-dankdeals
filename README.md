# DankDeals - Cannabis Delivery E-commerce Platform

## 🔴 IMPORTANT: Admin Dashboard Setup

**Admin access is restricted to: `admin@dankdealsmn.com`**

See `ADMIN_SETUP_GUIDE.md` for detailed instructions on:
- Running database migrations
- Creating the admin account  
- Accessing the admin dashboard at `/admin`

## Project Overview

DankDeals is a modern cannabis delivery e-commerce platform built with React, TypeScript, and Supabase. Features include:

- 🛒 Product catalog with categories and variants
- 🚚 Delivery zone management (Minneapolis area)
- 💳 Cash-on-delivery payment system
- 🔐 Age verification (21+)
- 📊 Admin dashboard with real-time analytics
- 📱 Mobile-responsive design

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Query, Context API
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

## Admin Dashboard

Access the admin dashboard at `/admin` after logging in as an admin user.
- Overview: `/admin`
- Manage Products: `/admin/products`
- Manage Orders: `/admin/orders`

Ensure your user has `is_admin: true` in Supabase.

## Database Setup

Run the migrations in order through Supabase SQL Editor:

**If you get errors about missing columns**, first run:
- `supabase/migrations/20250703000000-cleanup.sql`

Then run these in order:
1. `supabase/migrations/20250703000000-admin-dashboard.sql`
2. `supabase/migrations/20250703000001-store-settings.sql`
3. `supabase/migrations/20250703000002-admin-notifications.sql`
4. `supabase/migrations/20250703000003-setup-admin-user.sql`

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

## Support

- Admin Email: admin@dankdealsmn.com
- Documentation: See `ADMIN_DASHBOARD_README.md`
- Setup Guide: See `ADMIN_SETUP_GUIDE.md`

## License

Proprietary - All rights reserved
