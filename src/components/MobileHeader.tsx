import { Phone } from '@/lib/icons';
import { Link } from 'react-router-dom';
import { OptimizedLogo } from '@/components/OptimizedLogo';
import { Button } from '@/components/ui/button';
import { useIsAdmin } from '@/hooks/useIsAdmin';

interface MobileHeaderProps {
  title?: string;
}

export function MobileHeader({ title }: MobileHeaderProps) {
  const { isAdmin } = useIsAdmin();

  return (
    <header className="md:hidden sticky top-0 z-40 bg-gradient-dark border-b border-border/30 backdrop-blur-lg">
      {/* Phone number with new green */}
      <div className="bg-card/50 backdrop-blur-md text-primary px-4 py-3 border-b border-border/20">
        <a
          href="tel:612-930-1390"
          className="flex items-center justify-center gap-2 text-sm font-semibold"
          aria-label="Call or text to order"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          <span>Order Now: 612-930-1390</span>
        </a>
      </div>

      {/* Logo section with gradient */}
      <div className="bg-gradient-green px-4 py-5">
        {title ? (
          <h1 className="text-xl font-bold text-center text-primary-foreground drop-shadow-md">
            {title}
          </h1>
        ) : (
          <Link to="/" className="flex justify-center">
            <OptimizedLogo className="h-12 w-auto drop-shadow-lg" alt="DankDeals" priority={true} />
          </Link>
        )}
      </div>

      {isAdmin && (
        <div className="bg-card/50 backdrop-blur-md border-t border-border/20 px-4 py-3">
          <Button asChild size="sm" className="w-full">
            <Link to="/admin">Admin Dashboard</Link>
          </Button>
        </div>
      )}
    </header>
  );
}
