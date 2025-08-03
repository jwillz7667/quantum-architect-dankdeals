# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build & Development

- `npm run dev` - Start development server on port 8080
- `npm run build` - Production build with sitemap generation
- `npm run build:dev` - Development build
- `npm run preview` - Preview production build

### Testing

- `npm run test:unit` - Run unit tests with Vitest
- `npm run test:unit:watch` - Run unit tests in watch mode
- `npm run test:integration` - Run integration tests
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:e2e:ui` - Open Playwright UI
- `npm run test:smoke` - Run smoke tests (tests marked with @smoke)

### Code Quality

- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking (tsc --noEmit)
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Performance & Analysis

- `npm run lighthouse:local` - Run Lighthouse locally
- `npm run lighthouse:ci` - Run Lighthouse CI
- `npm run analyze` - Bundle size analysis

### Utilities

- `npm run sitemap` - Generate sitemap
- `npm run clean` - Clean build artifacts

## Architecture Overview

### Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Backend**: Supabase (PostgreSQL, Auth, Real-time subscriptions)
- **State Management**: React Query for server state, Context API for client state
- **Build Tool**: Vite with React plugin
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Deployment**: Vercel/Lovable platform

### Key Directories

- `/src/components/` - React components, UI components in `/ui` subdirectory
- `/src/pages/` - Route components (lazy loaded)
- `/src/hooks/` - Custom React hooks including cart and product management
- `/src/integrations/supabase/` - Supabase client and type definitions
- `/src/lib/` - Utilities, services, and configurations
- `/supabase/` - Database migrations and edge functions

### Core Features

1. **E-commerce Flow**: Product catalog → Cart → Checkout (address, payment, review, complete)
2. **Admin Dashboard**: Located at `/admin` - requires `is_admin: true` in user profile
3. **Real-time Updates**: Using Supabase real-time subscriptions via RealTimeContext
4. **Age Verification**: 21+ age gate required for cannabis compliance
5. **Delivery Management**: Minneapolis area delivery zones only
6. **Payment**: Cash-on-delivery only

### Important Patterns

- **Error Boundaries**: Wrap components for graceful error handling
- **Lazy Loading**: All page components are lazy loaded for code splitting
- **Type Safety**: Strict TypeScript with generated Supabase types
- **SEO**: SEOEnhanced component wrapper for meta tags
- **Image Optimization**: Use OptimizedImage/OptimizedProductImage components
- **Accessibility**: ARIA attributes and semantic HTML required

### Database Setup

Admin setup requires running migrations in order:

1. Run cleanup if errors about missing columns
2. Run admin-dashboard.sql
3. Run store-settings.sql
4. Run admin-notifications.sql
5. Run setup-admin-user.sql

Admin email is restricted to: `admin@dankdealsmn.com`

### Environment Variables

Required in `.env.local`:

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Testing Strategy

- Unit tests for components and hooks
- Integration tests for API interactions
- E2E tests for critical user flows
- Smoke tests for deployment verification

## Project-Specific Details

### Database Migrations

Run migrations in this specific order to avoid errors:

1. `20250124000000_create_base_schema.sql` - Core tables
2. `20250125000000_setup_auth_triggers.sql` - Auth setup
3. `20250126000000_order_email_trigger.sql` - Email triggers
4. `20250127000000_email_logging_tables_v2.sql` - Email logging
5. `20250128000000_enable_guest_orders.sql` - Guest checkout
6. Additional migrations for order columns and checkout fixes

### Supabase Edge Functions

Located in `/supabase/functions/`:

- `create-order` - Handles order creation
- `send-order-emails` - Sends order confirmation emails
- `process-email-queue` - Processes queued emails
- `test-admin-email` - Tests admin email functionality
- `resend-webhook` - Handles Resend webhook events

### Bundle Optimization

The Vite config uses manual chunking to optimize bundle sizes:

- Core React libraries are split into separate chunks
- UI libraries (Radix UI) are grouped together
- Supabase and React Query have dedicated chunks
- Small vendor packages are grouped into a vendor chunk

### Google Tag Manager Integration

- GTM container ID: `GTM-NFKK7D37`
- Tracking utilities in `/src/lib/gtm.ts`
- Automatic page tracking via `GTMTracker` component
- E-commerce event tracking for product views, cart actions, and purchases

### Critical Routes for Prefetching

The app prefetches these routes after initial load:

- Categories page
- Product detail pages
- Cart page

### User Authentication Flow

- OAuth providers: Google, Apple, Facebook
- Auth callback URL: `/auth/callback`
- Protected routes require authentication via `ProtectedRoute` component
- Guest checkout is enabled for orders

### Mobile Optimization

- Mobile menu context for responsive navigation
- Touch-optimized UI components
- PWA support with service worker caching

### Product Pricing Tiers

Standard pricing structure:

- 1/8 oz: $40
- 1/4 oz: $75
- 1/2 oz: $140
- 1 oz: $250
