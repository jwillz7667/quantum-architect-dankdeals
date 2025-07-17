import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Phone } from 'lucide-react';
import { OptimizedLogo } from '@/components/OptimizedLogo';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Categories', href: '/categories' },
  { label: 'Delivery Areas', href: '/delivery-area' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Blog', href: '/blog' },
];

export function DesktopHeader() {
  const location = useLocation();

  return (
    <header className="hidden md:block bg-background border-b border-border sticky top-0 z-40">
      <div className="container max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo - Responsive sizing */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <OptimizedLogo className="h-8 lg:h-10 xl:h-12 w-auto" alt="DankDeals" priority={true} />
          </Link>

          {/* Navigation - Responsive spacing */}
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-8 mx-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm xl:text-base font-medium transition-colors hover:text-primary whitespace-nowrap ${
                  location.pathname === item.href ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions - Responsive layout */}
          <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
            {/* Phone Number - Hide text on smaller screens */}
            <a
              href="tel:763-247-5378"
              className="flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              <Phone className="h-5 w-5" />
              <span className="hidden xl:inline">763-247-5378</span>
              <span className="hidden lg:inline xl:hidden text-sm">Call Now</span>
            </a>

            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Shopping Cart</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile/Tablet Navigation (md to lg) */}
        <nav className="flex lg:hidden items-center justify-center space-x-4 py-2 border-t">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`text-xs font-medium transition-colors hover:text-primary ${
                location.pathname === item.href ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
