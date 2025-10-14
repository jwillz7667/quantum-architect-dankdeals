import { Button } from '@/components/ui/button';
import { Leaf } from '@/lib/icons';
import { useNavigate } from 'react-router-dom';

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <div className="relative bg-gradient-card backdrop-blur-xl text-foreground rounded-2xl p-6 md:p-10 overflow-hidden border border-border/30 shadow-elevated">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none"></div>
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-md text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
            Minnesota's Finest, Delivered Fast
          </h2>
          <p className="text-base md:text-lg mb-6 text-muted-foreground">
            Premium cannabis products delivered to your door. Explore our curated selection of
            flower, edibles, and more.
          </p>
          <Button size="lg" variant="premium" onClick={() => navigate('/categories')}>
            Shop All Products
          </Button>
        </div>
        <div className="hidden md:block">
          <Leaf className="h-32 w-32 text-primary/30" />
        </div>
      </div>
    </div>
  );
}
