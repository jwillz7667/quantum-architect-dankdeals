import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
// import { useAuth } from "@/hooks/useAuth";
// import { useAdminAuth } from "@/hooks/useAdminAuth";
// import { useCart } from "@/hooks/useCart";

interface MobileHeaderProps {
  title: string;
  showMenu?: boolean;
}

export function MobileHeader({ title = 'DankDeals MN', showMenu = true }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
    { label: 'Cart', href: '/cart' },
    { label: 'Profile', href: '/profile' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Blog', href: '/blog' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Legal', href: '/legal' },
  ];

  return (
    <div className="md:hidden bg-gradient-mobile-header px-4 py-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-primary-foreground">{title}</h1>

      {showMenu && (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-light"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 space-y-4">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-lg text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              {/* Admin Dashboard Link - Only visible to admin users - COMMENTED OUT */}
              {/* {isAdmin && (
                <Link
                  to="/admin"
                  className="block px-4 py-2 text-lg text-foreground hover:bg-muted rounded-md transition-colors flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  Admin Dashboard
                </Link>
              )} */}
            </nav>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
