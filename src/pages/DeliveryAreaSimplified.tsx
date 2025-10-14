import { useEffect } from 'react';
import { DesktopHeader } from '@/components/DesktopHeader';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomNav } from '@/components/BottomNav';
import { DeliveryMap } from '@/components/DeliveryMap';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Truck, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TWIN_CITIES_SUBURBS } from '@/lib/cities';
import { cn } from '@/lib/utils';

export default function DeliveryAreaSimplified() {
  useEffect(() => {
    document.title = 'Delivery Areas | Cannabis Delivery Minnesota | DankDeals';
  }, []);

  const zones = [
    {
      name: 'Minneapolis & St. Paul',
      time: '30-60 min',
      fee: '$5',
      color: 'bg-green-500',
    },
    {
      name: 'Inner Suburbs',
      time: '45-90 min',
      fee: '$7.50',
      color: 'bg-green-400',
    },
    {
      name: 'Outer Metro',
      time: '60-120 min',
      fee: '$10',
      color: 'bg-green-300',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-dark pb-32 md:pb-0">
      <DesktopHeader />
      <MobileHeader title="Delivery Areas" />

      {/* Hero Section - Simplified */}
      <section className="relative bg-gradient-to-b from-primary/10 to-background pt-8 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              We Deliver to Your Area
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Fast, reliable cannabis delivery across the Twin Cities metro area
            </p>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
            <div className="bg-card rounded-xl p-6 text-center border">
              <Truck className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-lg mb-1">Same-Day Delivery</h3>
              <p className="text-sm text-muted-foreground">Order by 8pm</p>
            </div>
            <div className="bg-card rounded-xl p-6 text-center border">
              <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-lg mb-1">7 Days a Week</h3>
              <p className="text-sm text-muted-foreground">10am - 10pm</p>
            </div>
            <div className="bg-card rounded-xl p-6 text-center border">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-lg mb-1">$50 Minimum</h3>
              <p className="text-sm text-muted-foreground">Free delivery over $150</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Our Delivery Coverage</h2>

          {/* Map */}
          <div className="rounded-xl overflow-hidden shadow-lg mb-8 bg-card">
            <DeliveryMap className="h-[400px] md:h-[500px]" showCoverage />
          </div>

          {/* Zone Legend */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {zones.map((zone) => (
              <div key={zone.name} className="flex items-center gap-2">
                <div className={cn('w-4 h-4 rounded', zone.color)} />
                <span className="text-sm font-medium">{zone.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {zone.time} • {zone.fee}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* City Selection - Simplified Grid */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Select Your City</h2>
            <p className="text-lg text-muted-foreground">
              Choose your location for specific delivery info and local deals
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {TWIN_CITIES_SUBURBS.slice(0, 16).map((city) => (
              <Link key={city.id} to={`/delivery/${city.slug}`}>
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                >
                  <div className="text-center">
                    <MapPin className="h-5 w-5 mx-auto mb-1" />
                    <span className="block text-sm font-medium">{city.name}</span>
                  </div>
                </Button>
              </Link>
            ))}
          </div>

          <div className="text-center mt-6">
            <Button variant="ghost" size="lg" asChild>
              <Link to="/delivery-areas/all">View All Cities →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Order?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Browse our selection of premium cannabis products
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link to="/categories">Shop Now</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <a href="tel:612-930-1390" className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Call to Order
              </a>
            </Button>
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
