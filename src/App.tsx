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
import { MobileMenuProvider } from '@/context/MobileMenuContext';
import { GTMProvider } from '@/components/analytics/GTMProvider';

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
const DeliveryArea = lazyWithPrefetch(() => import('./pages/DeliveryAreaSimplified'));
const CityDelivery = lazyWithPrefetch(() => import('./pages/CityDeliverySimplified'));
const NotFound = lazyWithPrefetch(() => import('./pages/NotFound'));

// Lazy load checkout pages (only loaded when user checks out)
const OnePageCheckout = lazyWithPrefetch(() => import('./pages/checkout/OnePageCheckout'));
const CheckoutComplete = lazyWithPrefetch(() => import('./pages/checkout/CheckoutComplete'));

// Lazy load auth pages
const Login = lazyWithPrefetch(() => import('./pages/auth/Login'));
const Register = lazyWithPrefetch(() => import('./pages/auth/Register'));
const ForgotPassword = lazyWithPrefetch(() => import('./pages/auth/ForgotPassword'));
const AuthCallback = lazyWithPrefetch(() => import('./pages/auth/AuthCallback'));
const Welcome = lazyWithPrefetch(() => import('./pages/Welcome'));

// Lazy load profile page
const Profile = lazyWithPrefetch(() => import('./pages/ProfileSimplified'));
const Orders = lazyWithPrefetch(() => import('./pages/Orders'));
const UserSettings = lazyWithPrefetch(() => import('./pages/UserSettings'));

// Analytics test page (development only)
const AnalyticsTest = lazyWithPrefetch(() => import('./pages/AnalyticsTest'));

// Admin pages
const AdminLayout = lazyWithPrefetch(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazyWithPrefetch(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazyWithPrefetch(() => import('./pages/admin/AdminProducts'));
const AdminProductEditor = lazyWithPrefetch(() => import('./pages/admin/AdminProductEditor'));

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
            <GTMProvider>
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

                            {/* Auth routes */}
                            <Route path="/auth/login" element={<Login />} />
                            <Route path="/auth/register" element={<Register />} />
                            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                            <Route path="/auth/callback" element={<AuthCallback />} />
                            <Route
                              path="/welcome"
                              element={
                                <ProtectedRoute>
                                  <Welcome />
                                </ProtectedRoute>
                              }
                            />

                            {/* Cart and checkout - require age verification but not authentication */}
                            <Route path="/cart" element={<Cart />} />
                            <Route path="/checkout" element={<OnePageCheckout />} />
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
                            <Route
                              path="/orders"
                              element={
                                <ProtectedRoute>
                                  <Orders />
                                </ProtectedRoute>
                              }
                            />
                            <Route
                              path="/settings"
                              element={
                                <ProtectedRoute>
                                  <UserSettings />
                                </ProtectedRoute>
                              }
                            />

                            {/* Admin routes */}
                            <Route
                              path="/admin"
                              element={
                                <ProtectedRoute requireAdmin>
                                  <AdminLayout />
                                </ProtectedRoute>
                              }
                            >
                              <Route index element={<AdminDashboard />} />
                              <Route path="products" element={<AdminProducts />} />
                              <Route path="products/new" element={<AdminProductEditor />} />
                              <Route path="products/:id" element={<AdminProductEditor />} />
                            </Route>

                            {/* Analytics test route (development) */}
                            <Route path="/analytics-test" element={<AnalyticsTest />} />

                            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
                      </ProductsFilterProvider>
                    </CartProvider>
                  </RealTimeProvider>
                </MobileMenuProvider>
              </TooltipProvider>
            </GTMProvider>
          </SEOProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
