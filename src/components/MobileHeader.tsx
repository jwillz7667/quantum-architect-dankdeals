import { useState } from 'react';
import { Menu, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
// import { useAuth } from "@/hooks/useAuth";
// import { useAdminAuth } from "@/hooks/useAdminAuth";
// import { useCart } from "@/hooks/useCart";

interface MobileHeaderProps {
  title?: string;
  showMenu?: boolean;
}

export function MobileHeader({ title, showMenu = true }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
    { label: 'Cart', href: '/cart' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Blog', href: '/blog' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Legal', href: '/legal' },
  ];

  return (
    <div className="md:hidden">
      {/* Top bar with phone number */}
      <div className="bg-primary text-primary-foreground px-4 py-2 text-center">
        <a
          href="tel:763-247-5378"
          className="flex items-center justify-center gap-2 text-sm font-semibold"
        >
          <Phone className="h-4 w-4" />
          <span>Call/Text to Order: 763-247-5378</span>
        </a>
      </div>

      {/* Main header */}
      <div className="bg-gradient-mobile-header px-4 py-4 flex items-center justify-between">
        {title ? (
          <h1 className="text-xl font-bold text-primary-foreground">{title}</h1>
        ) : (
          <Link to="/" className="flex items-center">
            <img
              src="/assets/logos/dankdeals-logo.svg"
              alt="DankDeals"
              className="h-8 w-auto brightness-0 invert"
            />
          </Link>
        )}

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
                <div className="flex items-center justify-between">
                  <SheetTitle>Menu</SheetTitle>
                  <img
                    src="/assets/logos/dankdeals-cart-logo.svg"
                    alt="DankDeals"
                    className="h-8 w-8"
                  />
                </div>
              </SheetHeader>
              <nav className="mt-6 space-y-4">
                {/* Phone number at top of menu */}
                <a
                  href="tel:763-247-5378"
                  className="block px-4 py-3 text-center bg-primary text-primary-foreground rounded-md font-semibold"
                >
                  <Phone className="h-5 w-5 inline mr-2" />
                  763-247-5378
                </a>

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
    </div>
  );
}
