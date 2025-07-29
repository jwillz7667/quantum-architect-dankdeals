import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
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
import { PWAInstallButton, PWAStatusIndicator } from '@/components/PWAInstallButton';
import { MobileMenuProvider } from '@/context/MobileMenuContext';

import { lazyWithPrefetch, prefetchCriticalRoutes } from '@/lib/lazyWithPrefetch';

// Lazy load all page components for better code splitting
const Index = lazyWithPrefetch(() => import('./pages/Index'));
const ProductDetail = lazyWithPrefetch(() => import('./pages/ProductDetail'));
const Categories = lazyWithPrefetch(() => import('./pages/Categories'));
const Cart = lazyWithPrefetch(() => import('./pages/Cart'));
const FAQ = lazyWithPrefetch(() => import('./pages/FAQ'));
const Blog = lazyWithPrefetch(() => import('./pages/Blog'));
const BlogPost = lazyWithPrefetch(() => import('./pages/BlogPost'));
const Privacy = lazyWithPrefetch(() => import('./pages/Privacy'));
const Terms = lazyWithPrefetch(() => import('./pages/Terms'));
const Legal = lazyWithPrefetch(() => import('./pages/Legal'));
const DeliveryArea = lazyWithPrefetch(() => import('./pages/DeliveryArea'));
const CityDelivery = lazyWithPrefetch(() => import('./pages/CityDelivery'));
const NotFound = lazyWithPrefetch(() => import('./pages/NotFound'));
const HealthCheck = lazyWithPrefetch(() => import('./pages/HealthCheck'));

// Lazy load checkout pages (only loaded when user checks out)
const CheckoutAddress = lazyWithPrefetch(() => import('./pages/checkout/CheckoutAddress'));
const CheckoutPayment = lazyWithPrefetch(() => import('./pages/checkout/CheckoutPayment'));
const CheckoutReview = lazyWithPrefetch(() => import('./pages/checkout/CheckoutReview'));
const CheckoutComplete = lazyWithPrefetch(() => import('./pages/checkout/CheckoutComplete'));

// Lazy load auth pages
const Login = lazyWithPrefetch(() => import('./pages/auth/Login'));
const Register = lazyWithPrefetch(() => import('./pages/auth/Register'));
const ForgotPassword = lazyWithPrefetch(() => import('./pages/auth/ForgotPassword'));
const AuthCallback = lazyWithPrefetch(() => import('./pages/auth/AuthCallback'));

// Lazy load profile page
const Profile = lazyWithPrefetch(() => import('./pages/Profile'));

// Critical routes to prefetch after initial load
const criticalRoutes = [Categories, ProductDetail, Cart];

const App = () => {
  // Prefetch critical routes after initial load
  useEffect(() => {
    prefetchCriticalRoutes(criticalRoutes);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SEOProvider>
            <TooltipProvider>
              <MobileMenuProvider>
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
                          <Route path="/delivery-areas" element={<DeliveryArea />} />
                          <Route path="/delivery/:city" element={<CityDelivery />} />
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
                          <Route
                            path="/profile"
                            element={
                              <ProtectedRoute>
                                <Profile />
                              </ProtectedRoute>
                            }
                          />

                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </ProductsFilterProvider>
                  </CartProvider>
                </RealTimeProvider>

                {/* PWA Components */}
                <PWAInstallButton />
                <PWAStatusIndicator />
              </MobileMenuProvider>
            </TooltipProvider>
          </SEOProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
