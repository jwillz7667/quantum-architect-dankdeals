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
    <header className="md:hidden sticky top-0 z-40 bg-background border-b border-border">
      {/* Simplified header with phone number */}
      <div className="bg-white text-[#4caf50] px-4 py-3">
        <a
          href="tel:763-247-5378"
          className="flex items-center justify-center gap-2 text-sm font-medium"
          aria-label="Call or text to order"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          <span>Order Now: 763-247-5378</span>
        </a>
      </div>

      {/* Logo section with green background */}
      <div className="bg-primary px-4 py-4">
        {title ? (
          <h1 className="text-xl font-semibold text-center text-white">{title}</h1>
        ) : (
          <Link to="/" className="flex justify-center">
            <OptimizedLogo className="h-10 w-auto" alt="DankDeals" priority={true} />
          </Link>
        )}
      </div>

      {isAdmin && (
        <div className="bg-background border-t border-border px-4 py-3">
          <Button asChild size="sm" className="w-full">
            <Link to="/admin">Admin Dashboard</Link>
          </Button>
        </div>
      )}
    </header>
  );
}
