import { Button } from '@/components/ui/button';
import { Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <div className="relative bg-gradient-to-r from-green-800 to-green-600 text-white rounded-xl p-6 md:p-8 overflow-hidden">
      <div className="absolute inset-0 bg-hero-pattern opacity-10 pointer-events-none"></div>
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-md text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Minnesota's Finest, Delivered Fast
          </h2>
          <p className="text-base md:text-lg mb-4 text-green-100">
            Premium cannabis products delivered to your door. Explore our curated selection of
            flower, edibles, and more.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="bg-white text-primary hover:bg-gray-100 transition-colors"
            onClick={() => navigate('/categories')}
          >
            Shop All Products
          </Button>
        </div>
        <div className="hidden md:block">
          <Leaf className="h-24 w-24 text-white/20" />
        </div>
      </div>
    </div>
  );
}
