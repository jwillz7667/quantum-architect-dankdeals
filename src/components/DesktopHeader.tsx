import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Phone, ShoppingCart, User } from '@/lib/icons';
import { OptimizedLogo } from '@/components/OptimizedLogo';
import { useAuth } from '@/context/AuthContext';

export function DesktopHeader() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <header className="hidden md:block bg-background border-b border-border sticky top-0 z-40">
      {/* Top bar with phone number */}
      <div className="bg-primary text-primary-foreground py-2">
        <div className="container max-w-7xl mx-auto px-6 text-center">
          <a
            href="tel:763-247-5378"
            className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span>Order Now: 763-247-5378</span>
          </a>
        </div>
      </div>

      {/* Main header */}
      <div className="container max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <OptimizedLogo className="h-12 w-auto" alt="DankDeals" priority={true} />
          </Link>

          {/* Simplified navigation - right aligned */}
          <nav className="flex items-center gap-8" role="navigation">
            <Link
              to="/"
              className={`text-base font-medium transition-colors ${
                location.pathname === '/' ? 'text-primary' : 'text-foreground hover:text-primary'
              }`}
            >
              Shop
            </Link>
            <Link
              to="/cart"
              className={`flex items-center gap-2 text-base font-medium transition-colors ${
                location.pathname === '/cart'
                  ? 'text-primary'
                  : 'text-foreground hover:text-primary'
              }`}
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              <span>Cart</span>
            </Link>
            {user ? (
              <Link
                to="/profile"
                className={`flex items-center gap-2 text-base font-medium transition-colors ${
                  location.pathname === '/profile'
                    ? 'text-primary'
                    : 'text-foreground hover:text-primary'
                }`}
              >
                <User className="h-5 w-5" aria-hidden="true" />
                <span>Account</span>
              </Link>
            ) : (
              <Link to="/auth/login">
                <Button className="btn-primary">Sign In</Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
