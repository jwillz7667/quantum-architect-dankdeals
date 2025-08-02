import { Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LogoWithLink } from './logo';

export function Footer() {
  return (
    <footer className="mt-12 bg-[#4caf50]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center space-y-6">
          {/* Logo */}
          <LogoWithLink className="h-12 w-auto" priority={false} />
          
          {/* Contact Information */}
          <div className="text-center space-y-4">
            <div>
              <p className="text-sm text-white/90 mb-2">
                Premium Cannabis Delivery in Minnesota
              </p>
              <a
                href="tel:763-247-5378"
                className="inline-flex items-center gap-2 text-lg font-semibold text-white hover:text-white/80 transition-colors"
              >
                <Phone className="h-5 w-5" />
                Call/Text: 763-247-5378
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <nav className="flex flex-wrap gap-4 justify-center text-sm">
            <Link to="/faq" className="text-white/90 hover:text-white transition-colors">
              FAQ
            </Link>
            <Link to="/blog" className="text-white/90 hover:text-white transition-colors">
              Blog
            </Link>
            <Link to="/delivery-area" className="text-white/90 hover:text-white transition-colors">
              Delivery Areas
            </Link>
            <Link to="/terms" className="text-white/90 hover:text-white transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="text-white/90 hover:text-white transition-colors">
              Privacy
            </Link>
            <Link to="/legal" className="text-white/90 hover:text-white transition-colors">
              Legal
            </Link>
          </nav>

          {/* Legal Notice */}
          <p className="text-xs text-white/80 text-center">
            Licensed Minnesota Cannabis Retailer • 21+ Only • Cash on Delivery
          </p>
        </div>
      </div>
    </footer>
  );
}