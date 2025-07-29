import { Menu, Phone, User, LogOut } from '@/lib/icons';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { OptimizedLogo } from '@/components/OptimizedLogo';
import { useAuth } from '@/context/AuthContext';
import { useMobileMenu } from '@/context/MobileMenuContext';

interface MobileHeaderProps {
  title?: string;
  showMenu?: boolean;
}

export function MobileHeader({ title, showMenu = true }: MobileHeaderProps) {
  const { isOpen, setIsOpen } = useMobileMenu();
  const { user, signOut } = useAuth();

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
      <div className="bg-white px-4 py-4 flex items-center justify-between">
        {title ? (
          <h2 className="text-xl font-bold text-primary">{title}</h2>
        ) : (
          <Link to="/" className="flex items-center">
            <OptimizedLogo className="h-8 w-auto" alt="DankDeals" priority={true} />
          </Link>
        )}

        {showMenu && (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px] max-w-[85vw]">
              <SheetHeader className="pb-4">
                <div className="flex items-center justify-between gap-3 pr-2">
                  <SheetTitle className="text-lg font-bold">Menu</SheetTitle>
                  <div className="flex-shrink-0">
                    <OptimizedLogo
                      variant="cart"
                      alt="DankDeals"
                      className="h-8 w-8"
                      priority={false}
                    />
                  </div>
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

                {/* User Account Section */}
                <div className="border-t pt-4 mt-4">
                  {user ? (
                    <>
                      <div className="px-4 py-2">
                        <p className="text-sm font-medium text-muted-foreground">Signed in as</p>
                        <p className="text-sm font-semibold">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          void signOut();
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-lg text-foreground hover:bg-muted rounded-md transition-colors"
                      >
                        <LogOut className="mr-2 h-5 w-5" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/auth/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center px-4 py-2 text-lg text-foreground hover:bg-muted rounded-md transition-colors"
                    >
                      <User className="mr-2 h-5 w-5" />
                      Sign In
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  );
}
