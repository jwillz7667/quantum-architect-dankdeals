import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Phone, ShoppingCart, User } from '@/lib/icons';
import { OptimizedLogo } from '@/components/OptimizedLogo';
import { useAuth } from '@/context/AuthContext';

export function DesktopHeader() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = Boolean(user?.user_metadata?.['is_admin']);

  return (
    <header className="hidden md:block bg-background border-b border-border sticky top-0 z-40">
      {/* Top bar with phone number and auth/cart */}
      <div className="bg-white border-b">
        <div className="container max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <a
            href="tel:763-247-5378"
            className="inline-flex items-center gap-2 text-sm font-medium text-black hover:opacity-70 transition-opacity"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span>Order Now: 763-247-5378</span>
          </a>

          {/* Right-aligned navigation */}
          <nav className="flex items-center gap-4" role="navigation">
            <Link
              to="/cart"
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                location.pathname === '/cart' ? 'text-primary' : 'text-gray-600 hover:text-primary'
              }`}
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              <span>Cart</span>
            </Link>
            {isAdmin && (
              <Button
                asChild
                size="sm"
                variant={location.pathname.startsWith('/admin') ? 'default' : 'outline'}
              >
                <Link to="/admin">Admin Dashboard</Link>
              </Button>
            )}
            {user ? (
              <Link
                to="/profile"
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  location.pathname === '/profile'
                    ? 'text-primary'
                    : 'text-gray-600 hover:text-primary'
                }`}
              >
                <User className="h-5 w-5" aria-hidden="true" />
                <span>Account</span>
              </Link>
            ) : (
              <Link to="/auth/login">
                <Button className="bg-primary text-white hover:bg-primary/90 text-sm">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* Main header with centered logo */}
      <div className="bg-primary">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center py-4">
            {/* Centered Logo */}
            <Link to="/">
              <OptimizedLogo className="h-14 w-auto" alt="DankDeals" priority={true} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
