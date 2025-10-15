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
const FeaturedProductsGrid = lazy(() =>
  import('@/components/FeaturedProductsGrid').then((module) => ({
    default: module.FeaturedProductsGrid,
  }))
);
const BottomNav = lazy(() =>
  import('@/components/BottomNav').then((module) => ({ default: module.BottomNav }))
);
const DeliveryAreaMap = lazy(() =>
  import('@/components/DeliveryAreaMap').then((module) => ({ default: module.DeliveryAreaMap }))
);
const PromoBanner = lazy(() =>
  import('@/components/PromoBanner').then((module) => ({ default: module.PromoBanner }))
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
      telephone: '+1-612-930-1390',
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
    <div className="min-h-screen bg-gradient-dark pb-32 md:pb-0">
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
      <main className="max-w-md md:max-w-7xl mx-auto px-4 md:px-6 space-y-8 md:space-y-10 pt-6 md:pt-8 pb-28 md:pb-12">
        {/* Search Bar */}
        <SearchBar onFilter={() => console.log('Open filters')} />

        {/* Promotional Banner Carousel */}
        <Suspense fallback={<div className="h-32 md:h-40 bg-muted/30 rounded-xl animate-pulse" />}>
          <PromoBanner />
        </Suspense>

        {/* Categories Section */}
        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-foreground text-center">Categories</h2>
          <Suspense fallback={<div className="h-24 bg-muted/30 rounded-xl animate-pulse" />}>
            <CategoryRail />
          </Suspense>
        </div>

        {/* Hot Products */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Hot Right Now</h2>
            {
              <Button size="sm" variant="outline" onClick={() => navigate('/categories')}>
                View All
              </Button>
            }
          </div>
          <Suspense
            fallback={
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
                <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
                <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
                <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
              </div>
            }
          >
            <FeaturedProductsGrid />
          </Suspense>
        </div>

        {/* Delivery Area Section */}
        <div className="space-y-4">
          <Card className="bg-card/80 backdrop-blur-xl border-primary/20 overflow-hidden shadow-elevated">
            <CardContent className="p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck size={24} className="text-primary" />
                    <h3 className="text-2xl font-bold text-foreground">Fast Cannabis Delivery</h3>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Same-day delivery across Minneapolis, St. Paul & surrounding areas
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>40+ Areas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                      <span>$50+ Orders</span>
                    </div>
                  </div>
                  <Button variant="premium" onClick={() => navigate('/delivery-area')}>
                    View Delivery Areas
                  </Button>
                </div>
                {/* Map on desktop */}
                <div className="hidden lg:block w-full lg:w-96">
                  <Suspense
                    fallback={<div className="h-[200px] bg-muted/30 rounded-xl animate-pulse" />}
                  >
                    <DeliveryAreaMap
                      height="200px"
                      className="border-2 border-border/30 rounded-xl"
                    />
                  </Suspense>
                </div>
              </div>
              {/* Map on mobile */}
              <div className="lg:hidden mt-4">
                <Suspense
                  fallback={<div className="h-[150px] bg-muted/30 rounded-xl animate-pulse" />}
                >
                  <DeliveryAreaMap
                    height="150px"
                    className="border-2 border-border/30 rounded-xl"
                  />
                </Suspense>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Section */}
        <Footer />
      </main>

      {/* Bottom Navigation */}
      <Suspense fallback={<div className="h-16 bg-muted/30" />}>
        <BottomNav />
      </Suspense>
    </div>
  );
};

export default Index;
