import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Phone, ShoppingCart, User } from '@/lib/icons';
import { OptimizedLogo } from '@/components/OptimizedLogo';
import { useAuth } from '@/context/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';

export function DesktopHeader() {
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();

  return (
    <header className="hidden md:block bg-gradient-dark border-b border-border/30 backdrop-blur-lg sticky top-0 z-40">
      {/* Top bar with phone number and auth/cart */}
      <div className="bg-card/50 backdrop-blur-md border-b border-border/20">
        <div className="container max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <a
            href="tel:612-930-1390"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span>Order Now: 612-930-1390</span>
          </a>

          {/* Right-aligned navigation */}
          <nav className="flex items-center gap-4" role="navigation">
            <Link
              to="/cart"
              className={`flex items-center gap-2 text-sm font-semibold transition-all hover:scale-105 ${
                location.pathname === '/cart'
                  ? 'text-primary'
                  : 'text-foreground hover:text-primary'
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
                className={`flex items-center gap-2 text-sm font-semibold transition-all hover:scale-105 ${
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
                <Button size="sm" className="font-semibold">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* Main header with centered logo */}
      <div className="bg-gradient-green shadow-lg">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center py-5">
            {/* Centered Logo */}
            <Link to="/" className="transition-transform hover:scale-105">
              <OptimizedLogo
                className="h-16 w-auto"
                style={{
                  filter:
                    'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
                }}
                alt="DankDeals"
                priority={true}
              />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
