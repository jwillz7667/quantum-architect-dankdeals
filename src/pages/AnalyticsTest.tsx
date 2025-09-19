import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAnalytics } from '@/hooks/useAnalytics';
import { DesktopHeader } from '@/components/DesktopHeader';
import { MobileHeader } from '@/components/MobileHeader';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { CartItem } from '@/hooks/useCart';
import type { Product } from '@/types/database';

/**
 * Analytics Test Page
 * For testing GTM and GA4 implementation
 */
export default function AnalyticsTest() {
  const { analytics, trackError, trackSearch, trackPromoCodeUsed } = useAnalytics();
  const [events, setEvents] = useState<string[]>([]);

  const addEvent = (eventName: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEvents((prev) => [`[${timestamp}] ${eventName}`, ...prev.slice(0, 9)]);
    toast.success(`Event tracked: ${eventName}`);
  };

  const testPageView = () => {
    analytics.trackPageView('Analytics Test Page', 'Testing');
    addEvent('Page View');
  };

  const testProductView = () => {
    const mockProduct = {
      id: 'test-123',
      name: 'Test Product',
      price: 29.99,
      category_id: 'flower',
      strain_type: 'hybrid',
    } as Product;

    analytics.trackProductView(mockProduct);
    addEvent('Product View');
  };

  const testAddToCart = () => {
    const mockProduct = {
      id: 'test-123',
      name: 'Test Product',
      price: 29.99,
      category_id: 'flower',
      strain_type: 'hybrid',
    } as Product;

    analytics.trackAddToCart(mockProduct, 2);
    addEvent('Add to Cart');
  };

  const testBeginCheckout = () => {
    const mockItems: CartItem[] = [
      {
        id: '1',
        productId: 'test-123',
        name: 'Test Product',
        price: 29.99,
        quantity: 2,
        category: 'flower',
        variantId: 'var-1',
        image: '/placeholder.jpg',
        variant: { name: 'Regular', weight_grams: 3.5 },
      },
      {
        id: '2',
        productId: 'test-456',
        name: 'Another Product',
        price: 39.99,
        quantity: 1,
        category: 'edibles',
        variantId: 'var-2',
        image: '/placeholder.jpg',
        variant: { name: 'Regular', weight_grams: 3.5 },
      },
    ];

    analytics.trackBeginCheckout(mockItems, 99.97);
    addEvent('Begin Checkout');
  };

  const testPurchase = () => {
    const mockItems: CartItem[] = [
      {
        id: '1',
        productId: 'test-123',
        name: 'Test Product',
        price: 29.99,
        quantity: 2,
        category: 'flower',
        variantId: 'var-1',
        image: '/placeholder.jpg',
        variant: { name: 'Regular', weight_grams: 3.5 },
      },
    ];

    analytics.trackPurchase('ORDER-TEST-123', mockItems, 65.48, 5.23, 5.0);
    addEvent('Purchase');
  };

  const testSearch = () => {
    trackSearch('blue dream', 15);
    addEvent('Search');
  };

  const testPromoCode = () => {
    trackPromoCodeUsed('SAVE20', 20, true);
    addEvent('Promo Code Used');
  };

  const testError = () => {
    trackError('test_error', 'This is a test error for analytics', '/analytics-test');
    addEvent('Error Tracked');
  };

  const testUserEngagement = () => {
    analytics.trackEngagement(30000, 'page_interaction');
    addEvent('User Engagement');
  };

  const testScroll = () => {
    analytics.trackScroll(75);
    addEvent('Scroll (75%)');
  };

  const checkGTMStatus = () => {
    const gtmId = import.meta.env['VITE_GTM_ID'] as string | undefined;
    const hasDataLayer = typeof window !== 'undefined' && window.dataLayer;
    const hasGTM =
      typeof window !== 'undefined' && document.querySelector('script[src*="googletagmanager"]');

    return {
      configured: gtmId && gtmId !== 'GTM-XXXXXX',
      gtmId,
      dataLayerExists: hasDataLayer,
      scriptLoaded: hasGTM,
    };
  };

  const gtmStatus = checkGTMStatus();

  return (
    <div className="min-h-screen bg-background">
      <DesktopHeader />
      <MobileHeader title="Analytics Test" />

      <div className="container mx-auto p-6 space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Google Tag Manager & Analytics Test Page</CardTitle>
            <CardDescription>Test GTM and GA4 event tracking implementation</CardDescription>
          </CardHeader>
          <CardContent>
            {/* GTM Status */}
            <div className="mb-6 p-4 border rounded-lg">
              <h3 className="font-semibold mb-3">GTM Status</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {gtmStatus.configured ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm">GTM ID: {gtmStatus.gtmId || 'Not configured'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {gtmStatus.dataLayerExists ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    DataLayer: {gtmStatus.dataLayerExists ? 'Initialized' : 'Not found'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {gtmStatus.scriptLoaded ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    GTM Script: {gtmStatus.scriptLoaded ? 'Loaded' : 'Not loaded'}
                  </span>
                </div>
              </div>
            </div>

            {/* Configuration Instructions */}
            {!gtmStatus.configured && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">Setup Required</h4>
                <ol className="text-sm text-yellow-800 space-y-1">
                  <li>1. Create a Google Tag Manager account</li>
                  <li>2. Set up GA4 in GTM</li>
                  <li>3. Add GTM ID to your .env file:</li>
                  <li className="font-mono bg-yellow-100 p-2 rounded">VITE_GTM_ID=GTM-YOUR_ID</li>
                  <li>4. Restart the development server</li>
                </ol>
              </div>
            )}

            {/* Test Buttons */}
            <div className="space-y-4">
              <div>
                <Label>Ecommerce Events</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  <Button onClick={testProductView} variant="outline" size="sm">
                    Product View
                  </Button>
                  <Button onClick={testAddToCart} variant="outline" size="sm">
                    Add to Cart
                  </Button>
                  <Button onClick={testBeginCheckout} variant="outline" size="sm">
                    Begin Checkout
                  </Button>
                  <Button onClick={testPurchase} variant="outline" size="sm">
                    Purchase
                  </Button>
                </div>
              </div>

              <div>
                <Label>User Events</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  <Button onClick={testPageView} variant="outline" size="sm">
                    Page View
                  </Button>
                  <Button onClick={testSearch} variant="outline" size="sm">
                    Search
                  </Button>
                  <Button onClick={testPromoCode} variant="outline" size="sm">
                    Promo Code
                  </Button>
                  <Button onClick={testUserEngagement} variant="outline" size="sm">
                    Engagement
                  </Button>
                  <Button onClick={testScroll} variant="outline" size="sm">
                    Scroll
                  </Button>
                  <Button onClick={testError} variant="outline" size="sm">
                    Error
                  </Button>
                </div>
              </div>
            </div>

            {/* Event Log */}
            <div className="mt-6">
              <Label>Event Log</Label>
              <div className="mt-2 p-3 bg-muted rounded-lg h-48 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Click buttons above to test events
                  </p>
                ) : (
                  <div className="space-y-1">
                    {events.map((event, index) => (
                      <div key={index} className="text-sm font-mono">
                        {event}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Debug Info */}
            <div className="mt-6 p-3 bg-muted rounded-lg">
              <p className="text-sm font-mono">Open browser console to see detailed event data</p>
              <p className="text-sm font-mono mt-1">
                Check GTM Preview mode to verify events are firing
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
