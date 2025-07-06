import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
// import { useAdminAuth } from "@/hooks/useAdminAuth";

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Categories', href: '/categories' },
  { label: 'Delivery Areas', href: '/delivery-area' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Blog', href: '/blog' },
];

export function DesktopHeader() {
  const location = useLocation();
  const { user } = useAuth();
  // const { isAdmin } = useAdminAuth();

  return (
    <header className="hidden md:flex bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between w-full">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-primary">
          DankDeals
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
          <Link to="/cart">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </Link>

          <Link to={user ? '/profile' : '/auth'}>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>

          {!user && (
            <Link to="/auth">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
