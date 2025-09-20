# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DankDeals is a cannabis delivery e-commerce platform built with React, TypeScript, Vite, and Supabase. It features a complete shopping experience with product catalog, cart management, checkout flow, user authentication, and order tracking.

## Development Commands

### Core Development

- `npm run dev` - Start development server (port 8080)
- `npm run build` - Build production bundle with sitemap generation
- `npm run preview` - Preview production build locally

### Testing

- `npm run test:unit` - Run unit tests with Vitest
- `npm run test:unit:watch` - Run unit tests in watch mode
- `npm run test:integration` - Run integration tests
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run test:e2e:ui` - Run E2E tests with UI mode
- `npm run test:smoke` - Run smoke tests (quick E2E subset)

### Code Quality

- `npm run lint` - Run ESLint checks
- `npm run type-check` - Run TypeScript type checking (no emit)
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Performance & Analysis

- `npm run analyze` - Analyze bundle size with visualizer
- `npm run lighthouse:local` - Run Lighthouse performance audit locally

## Architecture

### Frontend Stack

- **UI Framework**: React 18 with TypeScript
- **Build Tool**: Vite with optimized chunking and PWA support
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query (TanStack Query) for server state, Context API for client state
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router v6 with lazy loading and code splitting

### Backend Infrastructure

- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with OAuth providers (Google, Apple, Facebook)
- **Real-time**: Supabase real-time subscriptions for live updates
- **Edge Functions**: Located in `supabase/functions/` for serverless operations:
  - `process-order` - Order processing workflow
  - `process-email-queue` - Email queue management
  - `persona-*` - Identity verification integration
  - `payments-*` - Payment processing (Aeropay, Stronghold)

### Key Architectural Patterns

#### Authentication Flow

- Multi-provider OAuth through Supabase Auth
- Protected routes via `ProtectedRoute` component
- Auth state managed in `AuthContext`
- Callback handling at `/auth/callback`

#### Data Fetching Strategy

- React Query for all API calls with caching
- Custom hooks in `src/hooks/` for domain logic
- Real-time updates via `RealTimeContext`
- Optimistic updates for cart operations

#### Code Organization

```
src/
├── components/     # Reusable UI components
│   ├── ui/        # Base shadcn/ui components
│   └── profile/   # Profile-specific components
├── pages/         # Route components
│   ├── auth/      # Authentication pages
│   └── checkout/  # Checkout flow pages
├── hooks/         # Custom React hooks
├── lib/           # Utility libraries and configs
├── context/       # React Context providers
└── types/         # TypeScript type definitions
```

## Database Schema

The database uses these main tables:

- `profiles` - User profile data linked to auth.users
- `products` - Product catalog with variants
- `orders` & `order_items` - Order management
- `addresses` - User delivery addresses
- `cart_items` - Persistent shopping cart

Run migrations in order via Supabase SQL Editor (see README.md for details).

## Environment Configuration

Required environment variables in `.env.local`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Testing Strategy

- **Unit Tests**: Component and hook testing with Vitest and React Testing Library
- **Integration Tests**: API and database interaction tests
- **E2E Tests**: Critical user flows with Playwright
- Test files follow pattern: `*.test.tsx` or `*.spec.tsx`
- Setup file: `src/test/setup.ts`

## Deployment

- **Primary**: Vercel deployment with environment variables
- **Alternative**: Lovable platform deployment
- **Edge Functions**: Deploy via Supabase CLI or dashboard
- GitHub Actions workflows handle CI/CD (`.github/workflows/`)

## Performance Optimizations

- Route-based code splitting with lazy loading
- Optimized chunking strategy in `vite-chunking.ts`
- PWA with service worker for offline support
- Image optimization with lazy loading
- Bundle compression (gzip + brotli)

## Security Considerations

- Row Level Security (RLS) policies on all database tables
- Content Security Policy (CSP) headers configured
- Age verification (21+) required for access
- OAuth providers for secure authentication
- Environment variables for sensitive configuration
