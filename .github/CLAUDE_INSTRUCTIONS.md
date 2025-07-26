# Claude AI Instructions for DankDeals MN

## 🏗️ Project Overview

DankDeals MN is a **cannabis delivery application** serving Minneapolis and St. Paul, Minnesota. This is a fully compliant, age-restricted platform for legal cannabis delivery.

### 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Deployment**: Vercel (Frontend) + Supabase (Backend)
- **Testing**: Vitest (Unit) + Playwright (E2E)
- **CI/CD**: GitHub Actions

## 🎯 Core Responsibilities

### 1. **Legal Compliance & Age Verification**

- ⚠️ **CRITICAL**: Always maintain age verification (21+) requirements
- Ensure all cannabis-related content includes proper disclaimers
- Follow Minnesota cannabis laws and regulations
- Verify delivery area restrictions (Minneapolis & St. Paul only)

### 2. **Code Quality Standards**

```typescript
// Always use TypeScript
interface ComponentProps {
  required: string;
  optional?: number;
}

// Follow existing patterns
const MyComponent: React.FC<ComponentProps> = ({ required, optional = 0 }) => {
  // Implementation
};
```

### 3. **Security Best Practices**

- **Row Level Security (RLS)**: Always implement for Supabase tables
- **Input Validation**: Use Zod schemas for all form inputs
- **Authentication**: Use Supabase Auth with proper session management
- **HTTPS Only**: All external communications must use HTTPS

### 4. **Performance Guidelines**

- **Lazy Loading**: Use React.lazy for route components
- **Image Optimization**: Use OptimizedProductImage component
- **Bundle Splitting**: Keep chunk sizes under 1MB
- **Core Web Vitals**: Maintain LCP < 2.5s, FID < 100ms, CLS < 0.1

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   ├── auth/            # Authentication components
│   └── profile/         # User profile components
├── pages/               # Route components
├── hooks/               # Custom React hooks
├── context/             # React context providers
├── lib/                 # Utility functions
├── integrations/        # External service integrations
└── types/               # TypeScript type definitions
```

## 🔧 Common Commands You Can Run

### Development

```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview built app
```

### Quality Assurance

```bash
npm run lint            # ESLint check
npm run lint:fix        # Fix ESLint issues
npm run type-check      # TypeScript check
npm run format:check    # Prettier check
npm run format          # Format code
```

### Testing

```bash
npm run test:unit       # Run unit tests
npm run test:e2e        # Run E2E tests
npm run test:coverage   # Generate coverage report
```

## 🎨 UI/UX Guidelines

### Design System

- **Primary Color**: Green (#22c55e) - cannabis theme
- **Typography**: Inter font family
- **Spacing**: Tailwind spacing scale (4px increments)
- **Border Radius**: Consistent rounded corners (md = 6px)

### Component Patterns

```tsx
// Always use shadcn/ui components as base
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mobile-first responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>

// Consistent loading states
{loading ? (
  <div className="flex items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
) : (
  // Content
)}
```

### Accessibility Requirements

- **Semantic HTML**: Use proper HTML elements
- **ARIA Labels**: Add for interactive elements
- **Color Contrast**: WCAG AA compliance (4.5:1 ratio)
- **Keyboard Navigation**: All interactive elements must be keyboard accessible

## 🔐 Security Considerations

### Row Level Security (RLS) Policies

```sql
-- Example: Users can only access their own data
CREATE POLICY "users_own_data" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Example: Public read access for products
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (is_active = true);
```

### Input Validation

```typescript
import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().min(1, 'Required'),
  city: z.string().min(1, 'Required'),
  zipCode: z.string().regex(/^\d{5}$/, 'Invalid ZIP code'),
});
```

## 🧪 Testing Guidelines

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('ProductCard', () => {
  it('displays product information correctly', () => {
    render(<ProductCard name="Test Product" price={25} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('user can complete checkout flow', async ({ page }) => {
  await page.goto('/');
  // Age verification
  await page.click('[data-testid="age-verify-yes"]');
  // Add to cart
  await page.click('[data-testid="add-to-cart"]');
  // Continue through checkout...
});
```

## 📊 Performance Monitoring

### Core Web Vitals Targets

- **LCP**: < 2.5 seconds
- **FID**: < 100 milliseconds
- **CLS**: < 0.1

### Bundle Size Limits

- **Main bundle**: < 1MB gzipped
- **Route chunks**: < 500KB gzipped
- **Vendor chunk**: < 1.5MB gzipped

## 🚀 Deployment Pipeline

### Staging Deployment

- Triggered on `develop` branch pushes
- Environment: `staging.dankdealsmn.com`
- Uses staging Supabase instance

### Production Deployment

- Triggered on `main` branch pushes after CI passes
- Environment: `dankdealsmn.com`
- Requires manual approval for major changes

## 🤖 AI Assistant Guidelines

### When Helping with Code Reviews

1. **Security First**: Always check for security vulnerabilities
2. **Performance Impact**: Consider bundle size and runtime performance
3. **Accessibility**: Verify WCAG compliance
4. **Mobile Experience**: Test responsive design
5. **Cannabis Compliance**: Verify age verification and legal requirements

### When Implementing Features

1. **Follow Existing Patterns**: Use established component and hook patterns
2. **TypeScript Strict**: All new code must be fully typed
3. **Test Coverage**: Include unit and integration tests
4. **Documentation**: Update relevant documentation
5. **Error Handling**: Implement proper error boundaries and states

### When Debugging Issues

1. **Check Logs**: Review browser console and Supabase logs
2. **Network Issues**: Verify API calls and responses
3. **State Management**: Check React context and component state
4. **Performance**: Profile with React DevTools
5. **Cross-browser**: Test in Chrome, Safari, Firefox

## 📞 Emergency Contacts & Escalation

### Critical Issues (Site Down, Security Breach)

- Check GitHub Actions for deployment failures
- Review Vercel and Supabase status pages
- Examine error logs in Sentry (if configured)

### Performance Issues

- Run Lighthouse audit: `npm run lighthouse`
- Check bundle analyzer output
- Review Core Web Vitals in Chrome DevTools

### Legal/Compliance Concerns

- Age verification must be functional at all times
- Delivery area restrictions must be enforced
- Cannabis product disclaimers must be visible

---

## 🎯 Quick Reference Commands

```bash
# Development workflow
npm run dev                 # Start development
npm run lint && npm run type-check && npm run test:unit  # Pre-commit checks
npm run build && npm run preview  # Test production build

# Common debugging
npm run test:unit -- --watch  # Watch mode testing
npm run test:e2e -- --debug   # Debug E2E tests
npm run lighthouse             # Performance audit

# Database operations
npx supabase start            # Start local Supabase
npx supabase db reset         # Reset local database
npx supabase gen types typescript --local  # Generate types
```

Remember: **Cannabis compliance and user safety are paramount**. When in doubt, err on the side of caution and request clarification!
