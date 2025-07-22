import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingCart, Menu } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: LayoutGrid, label: 'Categories', href: '/categories' },
  { icon: ShoppingCart, label: 'Cart', href: '/cart' },
  { icon: Menu, label: 'More', href: '/faq' }, // 'More' could link to FAQ or a dedicated menu page
];

export function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border shadow-up md:hidden z-50">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
              location.pathname === item.href
                ? 'text-primary'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
