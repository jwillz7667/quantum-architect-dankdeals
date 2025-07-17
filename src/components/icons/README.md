# Custom Icon System

This directory contains optimized custom SVG icons for the DankDeals application, designed to improve loading performance and provide consistent branding.

## Performance Benefits

1. **Inline SVG Loading**: Icons are embedded directly in components to eliminate HTTP requests
2. **Session Caching**: Dynamic icons are cached in sessionStorage to avoid re-fetching
3. **Lazy Loading**: Icons load only when needed with loading states
4. **Optimized Bundle Size**: Only used icons are included in the final bundle

## Available Icons

### Core E-commerce Icons

- `ShoppingCartIcon` - Custom shopping cart (Asset 4.svg)
- `SearchIcon` - Custom search magnifying glass (Asset 3.svg)
- `DeliveryTruckIcon` - Custom delivery truck (Asset 7.svg)

### Cannabis Branding Icons

- `CannabisLeafIcon` - Primary cannabis leaf for branding (Asset 1.svg)
- Available via CustomIcon: 'cannabis-plant', 'cannabis-leaf-alt'

### Business Icons (Available via CustomIcon)

- 'security-lock' - Asset 9.svg
- 'settings-gear' - Asset 13.svg
- 'checkmark' - Asset 37.svg
- 'analytics' - Asset 40.svg
- 'users' - Asset 31.svg
- 'clock' - Asset 32.svg
- 'home-delivery' - Asset 30.svg
- 'dropper' - Asset 18.svg
- 'medical-cross' - Asset 15.svg
- 'scale' - Asset 11.svg
- 'delete' - Asset 10.svg

## Usage Examples

### Inline SVG Components (Recommended for frequently used icons)

```tsx
import { ShoppingCartIcon, SearchIcon, CannabisLeafIcon } from '@/components/icons/CustomIcon';

// Shopping cart with custom size
<ShoppingCartIcon size={24} className="text-primary" />

// Search icon with hover effects
<SearchIcon size={20} className="text-muted-foreground hover:text-primary" />

// Cannabis leaf for branding
<CannabisLeafIcon size={16} className="brand-icon" />
```

### Dynamic Icon Loading (For less frequently used icons)

```tsx
import { CustomIcon } from '@/components/icons/CustomIcon';

// Security lock icon
<CustomIcon name="security-lock" size={20} aria-label="Secure checkout" />

// Settings gear
<CustomIcon name="settings-gear" size={24} className="text-muted-foreground" />
```

## Adding New Icons

1. Add the SVG file to `/public/assets/icons/`
2. Update the `iconMap` in `CustomIcon.tsx`
3. Create an inline component for frequently used icons
4. Add appropriate styles to `icons.css` if needed

## Performance Guidelines

1. **Use inline components** for icons used more than 3 times across the app
2. **Use CustomIcon** for occasional use icons
3. **Preload critical icons** by adding them to the session cache
4. **Optimize SVG paths** to reduce file size
5. **Use appropriate sizes** - don't scale icons beyond their optimal size

## Accessibility

All icons include:

- Proper `aria-label` attributes
- Role="img" for screen readers
- Focus states for keyboard navigation
- High contrast support

## Browser Support

- Modern browsers with SVG support
- Graceful degradation for older browsers
- Optimized for mobile devices

## File Structure

```
src/components/icons/
├── CustomIcon.tsx          # Main icon component with dynamic loading
├── DeliveryTruckIcon.tsx   # Inline delivery truck component
├── README.md               # This documentation
└── ...                     # Additional inline icon components
```
