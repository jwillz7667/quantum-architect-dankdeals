# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DankDeals is a cannabis delivery e-commerce platform for the Minneapolis area built with React, TypeScript, and Supabase. Key features include product catalog, delivery zone management, cash-on-delivery payments, age verification (21+), and admin dashboard.

## Essential Commands

### Development

```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build with sitemap
npm run preview      # Preview production build
```

### Code Quality

```bash
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run format       # Auto-format with Prettier
```

### Testing

```bash
npm run test:unit    # Run unit tests with Vitest
npm run test:e2e     # Run E2E tests with Playwright
npx vitest          # Run unit tests in watch mode
npx vitest src/__tests__/hooks/useCart.test.tsx  # Run specific test
```

## Architecture Overview

### Frontend Structure

- **Pages** (`/src/pages/`): React Router pages with lazy loading
  - `/admin/` - Admin dashboard (requires specific email access)
  - `/checkout/` - Multi-step checkout flow
  - `/profile/` - User account management
- **Components** (`/src/components/`): Reusable React components
  - `/ui/` - shadcn/ui components (Radix UI based)
- **State Management**: React Query + Context API
  - `useCart`, `useOrders`, `useProducts` - Main data hooks
  - AuthContext, RealTimeContext - Global state providers
- **Routing**: React Router v6 with lazy-loaded routes

### Backend Integration

- **Supabase** for database, auth, and real-time updates
- **Database Schema** (`/supabase/migrations/`):
  - Products with categories and variants
  - Orders with delivery tracking
  - Admin dashboard analytics
- **Edge Functions** (`/supabase/functions/`): Email processing

### Key Technical Details

- **Build Tool**: Vite with extensive optimization config
- **Styling**: Tailwind CSS with custom animations
- **Forms**: React Hook Form + Zod validation
- **Path Aliases**: `@/` maps to `./src/`
- **Images**: WebP format in `/public/assets/products/`
- **Deployment**: Netlify with custom headers and redirects

### Important Constraints

- **Age Verification**: 21+ requirement enforced
- **Payment**: Cash-only for legal compliance
- **Delivery**: Limited to Minneapolis zip codes
- **Admin Access**: Restricted to specific email (check AdminRoute.tsx)

### Testing Approach

- **Unit Tests**: Vitest with @testing-library/react
- **E2E Tests**: Playwright testing critical user flows
- **Test Setup**: Browser APIs mocked in `src/test/setup.ts`
- **Accessibility**: jest-axe for a11y testing

### Development Workflow

1. Always run `npm run type-check` before committing
2. Test files follow pattern: `*.test.tsx` for unit, `*.spec.ts` for E2E
3. Use existing UI components from `/src/components/ui/`
4. Follow existing patterns for hooks and context providers
5. Product images must be WebP format in both `/public/assets/products/` and `/src/assets/products/`

### Environment Variables

Required variables (see `.env.example`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SITE_URL`
- `VITE_ENV`
