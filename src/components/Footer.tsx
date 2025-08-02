import { Phone, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto bg-gradient-to-b from-[#4caf50] to-[#388e3c] relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white rounded-full blur-3xl" />
      </div>

      <div className="relative">
        {/* Mobile-first responsive container */}
        <div className="container mx-auto px-6 py-10 md:py-12">
          <div className="flex flex-col space-y-8">
            {/* Tagline section */}
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-white">DankDeals</h2>
              <p className="text-white/90 text-sm font-medium max-w-xs mx-auto">
                Premium Cannabis Delivery in Minnesota
              </p>
            </div>

            {/* Contact section with enhanced mobile touch targets */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
              <h3 className="text-white font-semibold text-center mb-4">Get in Touch</h3>

              {/* Primary CTA - Large touch target */}
              <a
                href="tel:763-247-5378"
                className="flex items-center justify-center gap-3 bg-white text-[#4caf50] rounded-xl px-6 py-4 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 group"
                aria-label="Call or text us at 763-247-5378"
              >
                <Phone className="h-5 w-5 group-hover:animate-pulse" />
                <span>Call/Text: 763-247-5378</span>
              </a>

              {/* Quick info pills */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-white/90">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs">Daily 10am-8pm</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-white/90">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs">Minneapolis Area</span>
                </div>
              </div>
            </div>

            {/* Navigation links - Mobile optimized grid */}
            <nav className="space-y-4" role="navigation" aria-label="Footer navigation">
              <h3 className="text-white/90 text-sm font-semibold text-center">Quick Links</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { to: '/faq', label: 'FAQ' },
                  { to: '/blog', label: 'Blog' },
                  { to: '/delivery-area', label: 'Delivery Areas' },
                  { to: '/terms', label: 'Terms' },
                  { to: '/privacy', label: 'Privacy' },
                  { to: '/legal', label: 'Legal' },
                ].map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="bg-white/10 backdrop-blur-sm text-white/90 hover:text-white hover:bg-white/20 rounded-lg px-4 py-3 text-center transition-all duration-200 font-medium min-h-[44px] flex items-center justify-center"
                    aria-label={`Go to ${label} page`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Legal notice with trust indicator */}
            <div className="border-t border-white/20 pt-6 space-y-3">
              <div className="flex items-center justify-center gap-2 text-white/80">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-xs text-center">Licensed Minnesota Cannabis Retailer</p>
              </div>
              <p className="text-xs text-white/60 text-center">
                Must be 21+ • Cash on Delivery • ID Required
              </p>
            </div>
          </div>
        </div>

        {/* Desktop enhancement */}
        <div className="hidden md:block absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </footer>
  );
}
