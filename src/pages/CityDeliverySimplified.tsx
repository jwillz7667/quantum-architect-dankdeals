import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Clock, Truck, Phone, ArrowLeft, Star } from 'lucide-react';
import { getCityBySlug } from '@/lib/cities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { DeliveryMap } from '@/components/DeliveryMap';
import { DesktopHeader } from '@/components/DesktopHeader';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomNav } from '@/components/BottomNav';
import { FeaturedProductsGrid } from '@/components/FeaturedProductsGrid';

export default function CityDeliverySimplified() {
  const { city: citySlug } = useParams();
  const city = citySlug ? getCityBySlug(citySlug) : undefined;

  if (!city) {
    return <Navigate to="/delivery-areas" replace />;
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `https://dankdealsmn.com/delivery/${city.slug}`,
    name: `Cannabis Delivery in ${city.name}, MN`,
    description: city.metaDescription,
    provider: {
      '@type': 'Organization',
      name: 'DankDeals',
      url: 'https://dankdealsmn.com',
    },
    areaServed: {
      '@type': 'City',
      name: city.name,
      addressRegion: 'MN',
      addressCountry: 'US',
      geo: {
        '@type': 'GeoCoordinates',
        latitude: city.coordinates.lat,
        longitude: city.coordinates.lng,
      },
    },
    serviceType: 'Cannabis Delivery',
    offers: {
      '@type': 'Offer',
      priceSpecification: [
        {
          '@type': 'DeliveryChargeSpecification',
          price: city.deliveryFee.toFixed(2),
          priceCurrency: 'USD',
        },
      ],
    },
  };

  return (
    <>
      <Helmet>
        <title>Cannabis Delivery in {city.name}, MN | Same-Day Service | DankDeals</title>
        <meta name="description" content={city.metaDescription} />
        <link rel="canonical" href={`https://dankdealsmn.com/delivery/${city.slug}`} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <DesktopHeader />
        <MobileHeader title={`Delivery to ${city.name}`} />

        {/* Hero Section with Map */}
        <section className="relative">
          {/* Map Background */}
          <div className="absolute inset-0 h-[400px] md:h-[500px] opacity-30">
            <DeliveryMap
              center={city.coordinates}
              zoom={13}
              className="h-full"
              showCoverage={false}
            />
          </div>

          {/* Content Overlay */}
          <div className="relative bg-gradient-to-b from-background/90 via-background/95 to-background pt-8 pb-16">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <Link
                to="/delivery-areas"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                All Delivery Areas
              </Link>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Cannabis Delivery in {city.name}
              </h1>

              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Fast, discreet delivery of premium cannabis products to your door
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge variant="secondary" className="text-base px-4 py-2">
                  <Truck className="h-4 w-4 mr-2" />
                  {city.deliveryTime}
                </Badge>
                <Badge variant="secondary" className="text-base px-4 py-2">
                  <MapPin className="h-4 w-4 mr-2" />${city.deliveryFee} Delivery
                </Badge>
                <Badge variant="secondary" className="text-base px-4 py-2">
                  <Star className="h-4 w-4 mr-2" />
                  4.9 Rating
                </Badge>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8" asChild>
                  <Link to="/categories">Shop {city.name} Delivery</Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                  <a href="tel:763-247-5378">
                    <Phone className="h-5 w-5 mr-2" />
                    Call Now
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Delivery Info Cards */}
        <section className="py-12 -mt-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-xl p-6 border shadow-sm">
                <Clock className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Delivery Hours</h3>
                <p className="text-muted-foreground mb-2">7 Days a Week</p>
                <p className="font-medium">10:00 AM - 10:00 PM</p>
              </div>

              <div className="bg-card rounded-xl p-6 border shadow-sm">
                <MapPin className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Service Area</h3>
                <p className="text-muted-foreground mb-2">All of {city.name}</p>
                <p className="font-medium">${city.minimumOrder} Minimum</p>
              </div>

              <div className="bg-card rounded-xl p-6 border shadow-sm">
                <Truck className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                <p className="text-muted-foreground mb-2">Typical time:</p>
                <p className="font-medium">{city.deliveryTime}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Products */}
        <section className="py-12 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Popular in {city.name}</h2>
            <p className="text-center text-muted-foreground mb-8">
              Top-rated products delivered daily to {city.name} residents
            </p>
            <FeaturedProductsGrid />
          </div>
        </section>

        {/* Local Info */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-primary/5 rounded-2xl p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-6 text-center">
                Why Choose DankDeals in {city.name}?
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <span className="text-primary">✓</span> Licensed & Legal
                  </h3>
                  <p className="text-muted-foreground">
                    Fully licensed cannabis delivery service operating legally in {city.name}, MN
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <span className="text-primary">✓</span> Local Knowledge
                  </h3>
                  <p className="text-muted-foreground">
                    Our drivers know {city.name} neighborhoods for fast, efficient delivery
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <span className="text-primary">✓</span> Discreet Service
                  </h3>
                  <p className="text-muted-foreground">
                    Unmarked vehicles and professional drivers ensure privacy
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <span className="text-primary">✓</span> Premium Selection
                  </h3>
                  <p className="text-muted-foreground">
                    Curated cannabis products from Minnesota's best growers
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Button size="lg" className="text-lg px-8" asChild>
                  <Link to="/categories">Start Shopping</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Nearby Cities */}
        <section className="py-12 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4">
            <h3 className="text-2xl font-bold text-center mb-6">We Also Deliver To</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {city.nearbyIds?.slice(0, 8).map((nearbyId) => {
                const nearbyCity = getCityBySlug(nearbyId);
                if (!nearbyCity) return null;
                return (
                  <Link key={nearbyId} to={`/delivery/${nearbyCity.slug}`}>
                    <Badge
                      variant="outline"
                      className="text-sm px-3 py-1.5 hover:bg-primary hover:text-primary-foreground cursor-pointer"
                    >
                      {nearbyCity.name}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <BottomNav />
      </div>
    </>
  );
}
