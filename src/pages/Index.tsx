import { SearchBar } from '@/components/SearchBar';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, MapPin, Truck } from '@/lib/icons';
import { Card, CardContent } from '@/components/ui/card';
import { SEOHead } from '@/components/SEOHead';
import { Suspense, lazy } from 'react';
import { Footer } from '@/components/Footer';

// Lazy load non-critical components to reduce initial bundle size
const CategoryRail = lazy(() =>
  import('@/components/CategoryRail').then((module) => ({ default: module.CategoryRail }))
);
const HeroSection = lazy(() =>
  import('@/components/HeroSection').then((module) => ({ default: module.HeroSection }))
);
const FeaturedProductsGrid = lazy(() =>
  import('@/components/FeaturedProductsGrid').then((module) => ({
    default: module.FeaturedProductsGrid,
  }))
);
const BottomNav = lazy(() =>
  import('@/components/BottomNav').then((module) => ({ default: module.BottomNav }))
);

const Index = () => {
  const navigate = useNavigate();

  const breadcrumbs = [{ name: 'Home', url: 'https://dankdealsmn.com/' }];

  const homePageStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'DankDeals - Premium Cannabis Delivery in Minnesota',
    description:
      "Minnesota's premier cannabis delivery service. Shop premium flower, edibles, concentrates & more.",
    url: 'https://dankdealsmn.com/',
    mainEntity: {
      '@type': 'LocalBusiness',
      name: 'DankDeals',
      description: 'Premium cannabis delivery service in Minnesota',
      url: 'https://dankdealsmn.com',
      telephone: '+1-763-247-5378',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Minneapolis',
        addressRegion: 'MN',
        addressCountry: 'US',
      },
      serviceArea: {
        '@type': 'GeoCircle',
        geoMidpoint: {
          '@type': 'GeoCoordinates',
          latitude: 44.9778,
          longitude: -93.265,
        },
        geoRadius: '30000',
      },
      openingHours: ['Mo-Su 10:00-22:00'],
      priceRange: '$$',
    },
  };

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-0">
      <SEOHead
        title="DankDeals - Premium Cannabis Delivery in Minnesota | Same-Day Delivery"
        description="Minnesota's premier cannabis delivery service. Shop premium flower, edibles, concentrates & more. Same-day delivery across Minneapolis, St. Paul & surrounding areas. Age 21+ only."
        keywords="cannabis delivery Minnesota, marijuana delivery Minneapolis, weed delivery St Paul, same day cannabis delivery, dispensary near me, legal cannabis Minnesota"
        url="https://dankdealsmn.com/"
        breadcrumbs={breadcrumbs}
        structuredData={homePageStructuredData}
      />
      <DesktopHeader />
      <MobileHeader />

      {/* Main Content */}
      <main className="max-w-md md:max-w-7xl mx-auto px-4 md:px-6 space-y-8 md:space-y-10 pt-6 md:pt-8 pb-20">
        {/* Welcome message for new falses */}
        {/* Search Bar */}
        <SearchBar onFilter={() => console.log('Open filters')} />

        {/* Categories Section */}
        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-foreground text-center">Categories</h2>
          <Suspense fallback={<div className="h-24 bg-gray-100 rounded-lg animate-pulse" />}>
            <CategoryRail />
          </Suspense>
        </div>

        {/* Hero Section */}
        <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
          <HeroSection />
        </Suspense>

        {/* Hot Products */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Hot Right Now</h2>
            {
              <Button size="sm" variant="primary-inverted" onClick={() => navigate('/categories')}>
                View All
              </Button>
            }
          </div>
          <Suspense
            fallback={
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            }
          >
            <FeaturedProductsGrid />
          </Suspense>
        </div>

        {/* Delivery Area Section */}
        <div className="space-y-4">
          <Card className="bg-gradient-hero text-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size={24} />
                    <h3 className="text-xl font-bold">Fast Cannabis Delivery</h3>
                  </div>
                  <p className="text-white/90 mb-4">
                    Same-day delivery across Minneapolis, St. Paul & surrounding areas
                  </p>
                  <div className="flex items-center gap-4 text-sm text-white/80 mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>40+ Areas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShoppingCart className="h-4 w-4" />
                      <span>$50+ Orders</span>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/delivery-area')}
                    className="bg-white text-primary hover:bg-white/90"
                  >
                    View Delivery Areas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Section */}
        <Footer />
      </main>

      {/* Bottom Navigation */}
      <Suspense fallback={<div className="h-16 bg-gray-100" />}>
        <BottomNav />
      </Suspense>
    </div>
  );
};

export default Index;
