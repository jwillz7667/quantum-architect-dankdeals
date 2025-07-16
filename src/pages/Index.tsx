import { SearchBar } from '@/components/SearchBar';
import { CategoryRail } from '@/components/CategoryRail';
import { BottomNav } from '@/components/BottomNav';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, MapPin, Truck, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SEOHead } from '@/components/SEOHead';
import { Suspense, lazy } from 'react';

// Lazy load non-critical components to reduce initial bundle size
const HeroSection = lazy(() => import('@/components/HeroSection'));
const FeaturedProductsGrid = lazy(() => import('@/components/FeaturedProductsGrid'));

const Index = () => {
  const navigate = useNavigate();

  const breadcrumbs = [{ name: 'Home', url: 'https://dankdealsmn.com/' }];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEOHead
        title="DankDeals - Premium Cannabis Delivery in Minnesota | Same-Day Delivery"
        description="Minnesota's premier cannabis delivery service. Shop premium flower, edibles, concentrates & more. Same-day delivery across Minneapolis, St. Paul & surrounding areas. Age 21+ only."
        keywords="cannabis delivery Minnesota, marijuana delivery Minneapolis, weed delivery St Paul, same day cannabis delivery, dispensary near me, legal cannabis Minnesota"
        url="https://dankdealsmn.com/"
        breadcrumbs={breadcrumbs}
      />
      <DesktopHeader />
      <MobileHeader title="DankDeals" />

      {/* Main Content */}
      <main className="max-w-md md:max-w-7xl mx-auto px-4 md:px-6 space-y-8 md:space-y-10 pt-6 md:pt-8">
        {/* Welcome message for new falses */}
        {/* Search Bar */}
        <SearchBar onFilter={() => console.log('Open filters')} />

        {/* Categories Section */}
        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Categories</h2>
          <CategoryRail />
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
              <Button size="sm" onClick={() => navigate('/categories')}>
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
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-6 w-6" />
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
                <div className="hidden md:block">
                  <MapPin className="h-20 w-20 text-white/20" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Section */}
        <div className="mt-12 mb-8 pb-8 border-t pt-8">
          <div className="text-center space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Premium Cannabis Delivery in Minnesota
              </p>
              <a
                href="tel:763-247-5378"
                className="inline-flex items-center gap-2 text-lg font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Phone className="h-5 w-5" />
                Call/Text: 763-247-5378
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              Licensed Minnesota Cannabis Retailer • 21+ Only • Cash on Delivery
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab="/" />
    </div>
  );
};

export default Index;
