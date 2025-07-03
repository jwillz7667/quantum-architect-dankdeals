# Database Setup Guide

This guide covers the clean database structure focused on user authentication and checkout flows.

## Database Schema Overview

### Core Tables

1. **`profiles`** - User profile information (extends Supabase auth.users)
2. **`categories`** - Product categories (Flower, Edibles, etc.)
3. **`products`** - Cannabis products with full details
4. **`addresses`** - User delivery/billing addresses
5. **`orders`** - Order records with embedded delivery info
6. **`order_items`** - Line items for each order (with product snapshots)
7. **`cart_items`** - Persistent shopping cart items

## Setup Instructions

### 1. Reset Database (Development Only)

If you need to start fresh:

```bash
# Connect to your Supabase instance and run:
supabase db reset
```

Or manually reset:

```sql
-- Run this in your Supabase SQL editor
\i supabase/reset-db.sql
```

### 2. Run Migrations

```bash
# Apply all migrations
supabase migration up

# Or apply specific migration
supabase migration up --target 20241201000003
```

### 3. Verify Setup

Check that all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- addresses
- cart_items
- categories
- order_items
- orders
- products
- profiles

## Migration Files

- `20241201000001_create_core_tables.sql` - Creates profiles, categories, products, addresses
- `20241201000002_create_checkout_tables.sql` - Creates orders, order_items, cart_items
- `20241201000003_seed_sample_data.sql` - Populates categories and products

## Key Features

### User Authentication
- Automatic profile creation on user signup
- Email-based authentication via Supabase Auth
- Date of birth collection for age verification

### Product Management
- Hierarchical categories with SEO-friendly slugs
- Full cannabis product details (THC/CBD, strain type, effects, flavors)
- Lab testing support
- Stock management
- Featured products

### Shopping Cart
- Persistent cart across sessions
- One item per product per user constraint
- Automatic cleanup on order completion

### Orders & Checkout
- Automatic order number generation (YYYYMMDD-0001 format)
- Embedded delivery address (for order history)
- Product snapshots (preserves product details at time of order)
- Minnesota tax calculation (8.75%)
- Free delivery over $50
- Order status tracking
- Payment method tracking

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Public read access for active products/categories
- Proper foreign key constraints

## Sample Data

The seed migration includes:
- 7 product categories
- 18 sample products across all categories
- Realistic THC/CBD percentages
- Stock quantities
- Featured products

## Environment Variables

Ensure these are set in your `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Functions

### Automatic Features
- Profile creation on user signup
- Order number generation
- Order total calculation (subtotal + tax + delivery fee)
- Updated timestamp triggers

### Business Logic
- Minnesota cannabis tax (8.75%)
- Free delivery threshold ($50)
- Order status workflow
- Stock management

## Testing

Run the application and verify:
1. User signup creates profile automatically
2. Products display with categories
3. Cart functionality works
4. Checkout process completes orders
5. Order history shows completed orders

## Troubleshooting

### Common Issues

1. **Migration fails**: Check for existing tables and reset if needed
2. **RLS blocking queries**: Ensure user is authenticated
3. **Type errors**: Regenerate types with `supabase gen types typescript`
4. **Missing products**: Check if sample data migration ran

### Generate Types

Update TypeScript types after schema changes:

```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

## Production Considerations

- Remove or secure the reset script
- Set up proper backup procedures
- Monitor RLS policies performance
- Consider read replicas for high traffic
- Implement proper error handling
- Add monitoring for failed orders 