import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, User } from '@/lib/icons';
import { useAuth } from '@/context/AuthContext';

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  // Simplified navigation - only essential items
  const navItems = [
    { icon: Home, label: 'Shop', href: '/' },
    { icon: ShoppingCart, label: 'Cart', href: '/cart' },
    { icon: User, label: user ? 'Account' : 'Login', href: user ? '/profile' : '/auth/login' },
  ];

  return (
    <>
      {/* Spacer to prevent content overlap - only visible on mobile */}
      <div className="h-20 md:hidden" aria-hidden="true" />

      <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
        <div className="flex justify-around items-center h-full px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-6 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className="h-6 w-6" aria-hidden="true" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
