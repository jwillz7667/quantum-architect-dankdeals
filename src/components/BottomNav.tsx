import { Home, Grid3X3, ShoppingCart, MapPin } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Grid3X3, label: 'Categories', href: '/categories' },
  { icon: MapPin, label: 'Delivery', href: '/delivery-area' },
  { icon: ShoppingCart, label: 'Cart', href: '/cart' },
];

interface BottomNavProps {
  activeTab?: string;
}

export function BottomNav({ activeTab }: BottomNavProps) {
  const location = useLocation();
  const currentPath = activeTab || location.pathname;

  return (
    <nav className="bottom-nav md:hidden">
      <div className="max-w-md mx-auto px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link key={item.href} to={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col items-center gap-1 p-2 h-auto ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`}
                  />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
