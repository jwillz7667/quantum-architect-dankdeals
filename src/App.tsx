import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Suspense, lazy, Component } from 'react';
import { ProductsFilterProvider } from '@/hooks/useProductsFilter';
import { CartProvider } from '@/hooks/CartProvider';
import { PageLoader } from '@/components/PageLoader';
import { RealTimeProvider } from '@/context/RealTimeContext';

// Lazy load all page components for better code splitting
const Index = lazy(() => import('./pages/Index'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Categories = lazy(() => import('./pages/Categories'));
const Cart = lazy(() => import('./pages/Cart'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Legal = lazy(() => import('./pages/Legal'));
const DeliveryArea = lazy(() => import('./pages/DeliveryArea'));
const NotFound = lazy(() => import('./pages/NotFound'));
const HealthCheck = lazy(() => import('./pages/HealthCheck'));

// Lazy load checkout pages (only loaded when user checks out)
const CheckoutAddress = lazy(() => import('./pages/checkout/CheckoutAddress'));
const CheckoutPayment = lazy(() => import('./pages/checkout/CheckoutPayment'));
const CheckoutReview = lazy(() => import('./pages/checkout/CheckoutReview'));
const CheckoutComplete = lazy(() => import('./pages/checkout/CheckoutComplete'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Simple error boundary for React errors
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">Please refresh the page to try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RealTimeProvider>
            <CartProvider>
              <ProductsFilterProvider>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/delivery-area" element={<DeliveryArea />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/legal" element={<Legal />} />
                    <Route path="/checkout/address" element={<CheckoutAddress />} />
                    <Route path="/checkout/payment" element={<CheckoutPayment />} />
                    <Route path="/checkout/review" element={<CheckoutReview />} />
                    <Route path="/checkout/complete" element={<CheckoutComplete />} />

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="/health" element={<HealthCheck />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ProductsFilterProvider>
            </CartProvider>
          </RealTimeProvider>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
