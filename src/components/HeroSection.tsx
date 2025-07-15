import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { SimpleImage } from '@/components/SimpleImage';
import { getProductImages } from '@/lib/productImages';

export function HeroSection() {
  // Get a featured product image - using Wedding Cake as the featured product
  const featuredProductImages = getProductImages(
    '44444444-4444-4444-4444-444444444444',
    'Wedding Cake',
    'flower'
  );

  return (
    <div className="space-y-8">
      {/* Call to Action Bar */}
      <div className="bg-primary text-primary-foreground rounded-xl p-4 text-center mb-8">
        <a
          href="tel:763-247-5378"
          className="flex items-center justify-center gap-2 font-semibold text-lg hover:opacity-90 transition-opacity"
        >
          <Phone className="h-5 w-5" />
          <span>Call or Text to Order: 763-247-5378</span>
        </a>
      </div>

      {/* Featured Product */}
      <Link
        to="/product/44444444-4444-4444-4444-444444444444"
        aria-label="View Wedding Cake cannabis product details"
      >
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary to-primary-light shadow-elevated cursor-pointer hover:shadow-glow transition-all duration-300">
          <div className="absolute inset-0 gradient-overlay" />
          <div className="relative aspect-[16/9] flex items-end p-6">
            <div className="absolute top-1/2 right-2 md:right-4 transform -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32">
              <SimpleImage
                src={featuredProductImages.main}
                alt="Wedding Cake - Premium Indica Cannabis Flower"
                className="w-full h-full rounded-lg shadow-lg object-cover"
              />
            </div>
            <div className="text-white z-10">
              <div
                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 bg-primary text-primary-foreground mb-2"
                role="img"
                aria-label="Featured product"
              >
                Featured
              </div>
              <h2 className="text-2xl font-bold mb-1">Wedding Cake</h2>
              <p className="text-white/90">Premium Indica - From $35.00</p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
