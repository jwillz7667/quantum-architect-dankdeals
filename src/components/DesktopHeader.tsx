import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Phone } from 'lucide-react';

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
    <header className="hidden md:flex bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between w-full">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src="/assets/logos/dankdeals-logo.svg" alt="DankDeals" className="h-10 w-auto" />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === item.href ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Admin Dashboard Link - Only visible to admin users - COMMENTED OUT */}
          {/* {isAdmin && (
            <Link
              to="/admin"
              className={`nav-item ${
                location.pathname.startsWith("/admin")
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-muted"
              } px-3 py-2 rounded-md text-sm font-medium transition-colors`}
            >
              <Shield className="h-4 w-4 mr-2 inline" />
              Admin Dashboard
            </Link>
          )} */}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Phone Number - Prominent Display */}
          <a
            href="tel:763-247-5378"
            className="flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors"
          >
            <Phone className="h-5 w-5" />
            <span>763-247-5378</span>
          </a>

          <Link to="/cart">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
