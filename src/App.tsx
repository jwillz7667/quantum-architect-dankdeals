import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ProductsFilterProvider } from '@/hooks/useProductsFilter';
import { CartProvider } from '@/hooks/CartProvider';
import { PageLoader } from '@/components/PageLoader';
import { RealTimeProvider } from '@/context/RealTimeContext';
import { queryClient } from '@/lib/react-query/config';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AgeGate } from '@/components/AgeGate';
import { SEOProvider } from '@/components/SEOEnhanced';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

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

// Lazy load auth pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'));

// Lazy load profile page
const Profile = lazy(() => import('./pages/Profile'));

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SEOProvider>
          <TooltipProvider>
            <AgeGate />
            <Toaster />
            <Sonner />
            <RealTimeProvider>
              <CartProvider>
                <ProductsFilterProvider>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<Index />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/delivery-area" element={<DeliveryArea />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:slug" element={<BlogPost />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/legal" element={<Legal />} />
                      <Route path="/health" element={<HealthCheck />} />

                      {/* Auth routes */}
                      <Route path="/auth/login" element={<Login />} />
                      <Route path="/auth/register" element={<Register />} />
                      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />

                      {/* Cart and checkout - require age verification but not authentication */}
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout/address" element={<CheckoutAddress />} />
                      <Route path="/checkout/payment" element={<CheckoutPayment />} />
                      <Route path="/checkout/review" element={<CheckoutReview />} />
                      <Route path="/checkout/complete" element={<CheckoutComplete />} />

                      {/* Protected routes */}
                      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </ProductsFilterProvider>
              </CartProvider>
            </RealTimeProvider>
          </TooltipProvider>
        </SEOProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
