import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Clock, DollarSign, Truck } from 'lucide-react';
import { getCityBySlug } from '@/lib/cities';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FeaturedProductsGrid } from '@/components/FeaturedProductsGrid';
import { DesktopHeader } from '@/components/DesktopHeader';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomNav } from '@/components/BottomNav';

export default function CityDelivery() {
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
          eligibleTransactionVolume: {
            '@type': 'PriceSpecification',
            price: city.minimumOrder.toFixed(2),
            priceCurrency: 'USD',
          },
        },
      ],
    },
    hoursAvailable: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '10:00',
      closes: '22:00',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://dankdealsmn.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Delivery Areas',
        item: 'https://dankdealsmn.com/delivery-areas',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: city.name,
        item: `https://dankdealsmn.com/delivery/${city.slug}`,
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Cannabis Delivery in {city.name}, MN | Same-Day Weed Delivery | DankDeals</title>
        <meta name="description" content={city.metaDescription} />
        <link rel="canonical" href={`https://dankdealsmn.com/delivery/${city.slug}`} />

        {/* Open Graph */}
        <meta property="og:title" content={`Cannabis Delivery in ${city.name}, MN | DankDeals`} />
        <meta property="og:description" content={city.metaDescription} />
        <meta property="og:url" content={`https://dankdealsmn.com/delivery/${city.slug}`} />
        <meta property="og:type" content="website" />

        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <DesktopHeader />
        <MobileHeader title={`${city.name} Delivery`} />
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-white py-16">
          <div className="container mx-auto px-4">
            <nav className="mb-6 text-sm">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link to="/" className="text-gray-600 hover:text-primary">
                    Home
                  </Link>
                </li>
                <li className="text-gray-400">/</li>
                <li>
                  <Link to="/delivery-areas" className="text-gray-600 hover:text-primary">
                    Delivery Areas
                  </Link>
                </li>
                <li className="text-gray-400">/</li>
                <li className="text-gray-900 font-medium">{city.name}</li>
              </ol>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Cannabis Delivery in {city.name}, MN
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl">{city.heroDescription}</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Clock className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Delivery Time</h3>
                <p className="text-gray-600">{city.deliveryTime}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <DollarSign className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Minimum Order</h3>
                <p className="text-gray-600">${city.minimumOrder}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Truck className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Delivery Fee</h3>
                <p className="text-gray-600">${city.deliveryFee}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <MapPin className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1">Zip Codes</h3>
                <p className="text-gray-600">{city.zipCodes.slice(0, 3).join(', ')}...</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Link to="/products">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Shop Now
                </Button>
              </Link>
              <Link to="/delivery-areas">
                <Button size="lg" variant="outline">
                  View All Areas
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Service Information */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">
              Why Choose DankDeals for {city.name} Cannabis Delivery?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="text-xl font-semibold mb-4">Fast, Reliable Service</h3>
                <p className="text-gray-600 mb-4">
                  Get your favorite cannabis products delivered to your door in {city.name} within{' '}
                  {city.deliveryTime}. Our professional delivery team ensures discreet, secure
                  delivery every time.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ Same-day delivery available</li>
                  <li>✓ Professional, discreet drivers</li>
                  <li>✓ Real-time order tracking</li>
                  <li>✓ Secure, contactless delivery options</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Premium Product Selection</h3>
                <p className="text-gray-600 mb-4">
                  Browse our extensive menu of lab-tested cannabis products. From premium flower to
                  artisan edibles, we have something for every {city.name} resident.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ Lab-tested for quality and safety</li>
                  <li>✓ Wide variety of strains and products</li>
                  <li>✓ Competitive prices</li>
                  <li>✓ Regular deals and promotions</li>
                </ul>
              </div>
            </div>

            {/* Local SEO Content */}
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4">
                Cannabis Delivery Service Areas in {city.name}
              </h3>
              <p className="text-gray-600 mb-4">
                DankDeals proudly serves all neighborhoods in {city.name}, {city.county} County.
                Whether you're in downtown {city.name} or the surrounding areas, we deliver premium
                cannabis products right to your door.
              </p>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Zip Codes We Serve in {city.name}:</h4>
                <p className="text-gray-600">{city.zipCodes.join(', ')}</p>
              </div>
              {city.population && (
                <p className="text-gray-600">
                  With a population of {city.population.toLocaleString()}, {city.name} is one of
                  Minnesota's key cities, and we're proud to be the preferred cannabis delivery
                  service for residents seeking quality, convenience, and reliability.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Popular Products for {city.name} Delivery</h2>
            <FeaturedProductsGrid />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Order Cannabis Delivery in {city.name}?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers in {city.name} who trust DankDeals for their
              cannabis delivery needs. Order now and get it delivered today!
            </p>
            <Link to="/products">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Start Shopping
              </Button>
            </Link>
          </div>
        </section>
      </div>

      <BottomNav />
    </>
  );
}
