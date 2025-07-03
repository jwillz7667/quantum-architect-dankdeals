# DankDeals Admin Dashboard

## Overview

The DankDeals Admin Dashboard is a comprehensive management system for cannabis dispensary operations. Built with React, TypeScript, and Supabase, it provides real-time analytics, inventory management, order processing, and customer relationship management.

## Features

### 🎯 Core Features

- **Real-time Dashboard**: Live metrics and analytics with automatic updates
- **Order Management**: Process, track, and manage delivery orders
- **Inventory Control**: Track stock levels with low inventory alerts
- **User Management**: Admin user roles and permissions
- **Reporting System**: Generate and export business reports
- **Notification System**: Real-time alerts for critical events
- **Settings Management**: Configure store operations and preferences

### 📊 Analytics

- Revenue tracking and trends
- Order volume analysis
- Product performance metrics
- Customer behavior insights
- Inventory turnover rates

### 🔔 Notifications

- New order alerts
- Low inventory warnings
- User registration notifications
- System alerts and updates
- Customizable notification preferences

### 🔒 Security

- Role-based access control (RBAC)
- Admin activity logging
- IP whitelisting (optional)
- Session management
- Audit trails

## Technical Architecture

### Frontend Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Query** for data fetching
- **React Router** for navigation
- **date-fns** for date manipulation
- **Recharts** for data visualization

### Backend Stack

- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security (RLS)
- **Real-time subscriptions** for live updates
- **Edge Functions** for serverless computing

### Database Schema

Key tables:
- `profiles` - User profiles with roles
- `orders` - Order management
- `products` & `product_variants` - Inventory
- `admin_notifications` - Real-time alerts
- `store_settings` - Configuration
- `admin_activity_logs` - Audit trails

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn/bun
- Supabase account and project
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/dankdeals.git
cd dankdeals
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run database migrations:
```bash
npx supabase db push
```

5. Seed initial data (optional):
```bash
npx supabase db seed
```

6. Start development server:
```bash
npm run dev
```

### Admin Access

**Only `admin@dankdealsmn.com` can access the admin dashboard.**

The admin user is automatically configured when you sign up with this email address. No manual database updates are required.

## Usage Guide

### Accessing the Admin Dashboard

1. Navigate to `/admin`
2. Sign in with admin credentials
3. You'll be redirected to the dashboard overview

### Navigation

- **Dashboard**: Overview of key metrics
- **Orders**: Manage customer orders
- **Products**: Inventory management
- **Users**: Customer and admin management
- **Analytics**: Detailed business insights
- **Activity**: Admin action logs
- **Reports**: Generate business reports
- **Settings**: Configure store settings

### Managing Orders

1. Navigate to Orders section
2. View pending, confirmed, and delivered orders
3. Update order status
4. Print delivery labels
5. Contact customers

### Managing Inventory

1. Go to Products section
2. Add/edit products and variants
3. Update stock levels
4. Set low inventory thresholds
5. Manage product categories

### Generating Reports

1. Navigate to Reports section
2. Select report type
3. Choose date range
4. Generate report
5. Export as JSON/CSV/PDF

## Security Best Practices

### Authentication

- Use strong passwords
- Enable 2FA when available
- Regular password rotation
- Monitor admin activity logs

### Access Control

- Limit admin accounts
- Use role-based permissions
- Review access regularly
- Remove inactive admins

### Data Protection

- All data encrypted in transit
- RLS policies enforce access
- Regular security audits
- GDPR/CCPA compliance

## Deployment

### Vercel Deployment

1. Connect GitHub repository
2. Set environment variables
3. Deploy with one click

### Manual Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Required for production:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional:
- `VITE_PLAUSIBLE_DOMAIN` - Analytics
- `VITE_SENTRY_DSN` - Error tracking

## API Documentation

### Supabase Functions

#### `get_dashboard_stats(date_from, date_to)`
Returns aggregated dashboard statistics

#### `get_product_performance(date_from, date_to)`
Returns product sales performance data

#### `create_admin_notification(type, title, message, metadata)`
Creates notifications for all admins

#### `notify_admin(admin_id, type, title, message, metadata)`
Sends notification to specific admin

## Troubleshooting

### Common Issues

1. **Can't access admin panel**
   - Verify user has 'admin' role in profiles table
   - Check RLS policies are enabled
   - Clear browser cache

2. **Real-time updates not working**
   - Check Supabase realtime is enabled
   - Verify subscription permissions
   - Check browser console for errors

3. **Reports not generating**
   - Ensure database functions exist
   - Check date range is valid
   - Verify data exists for period

### Debug Mode

Enable debug logging:
```javascript
localStorage.setItem('debug', 'dankdeals:*');
```

## Contributing

### Development Workflow

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request
5. Code review
6. Merge to main

### Code Standards

- TypeScript strict mode
- ESLint + Prettier
- Component tests
- E2E tests for critical flows
- Accessibility compliance

## License

Proprietary - All rights reserved

## Support

For technical support:
- Email: admin@dankdealsmn.com
- Documentation: This README and ADMIN_SETUP_GUIDE.md
- Admin Dashboard: /admin (restricted to admin@dankdealsmn.com)

## Changelog

### v1.0.0 (2024-01-03)
- Initial admin dashboard release
- Core order management
- Basic analytics
- User management
- Real-time notifications

### Roadmap

- [ ] Advanced analytics with AI insights
- [ ] Mobile admin app
- [ ] Bulk operations
- [ ] Email campaign management
- [ ] Loyalty program management
- [ ] Driver tracking integration
- [ ] POS system integration 