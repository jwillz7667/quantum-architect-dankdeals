import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Suspense, lazy } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { ProductsFilterProvider } from '@/hooks/useProductsFilter';
import { CartProvider } from '@/hooks/useCart';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageLoader } from '@/components/PageLoader';
import Index from './pages/Index'; // Import directly for now

// Lazy load all page components for better code splitting
// const Index = lazy(() => import('./pages/Index'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Auth = lazy(() => import('./pages/Auth'));
const Categories = lazy(() => import('./pages/Categories'));
const Cart = lazy(() => import('./pages/Cart'));
const Profile = lazy(() => import('./pages/Profile'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Blog = lazy(() => import('./pages/Blog'));
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

// Lazy load profile pages (only loaded when user visits profile)
const ProfileOrders = lazy(() => import('./pages/profile/ProfileOrders'));
const ProfilePersonal = lazy(() => import('./pages/profile/ProfilePersonal'));
const ProfileAddress = lazy(() => import('./pages/profile/ProfileAddress'));
const ProfilePayment = lazy(() => import('./pages/profile/ProfilePayment'));
const ProfileSettings = lazy(() => import('./pages/profile/ProfileSettings'));

// Admin imports - COMMENTED OUT
// import { AdminDashboard } from "./pages/admin/AdminDashboard";
// import { Overview } from "./pages/admin/Overview";
// import { AdminOrders } from "./pages/admin/AdminOrders";
// import { AdminProducts } from "./pages/admin/AdminProducts";
// import { AdminUsers } from "./pages/admin/AdminUsers";
// import { AdminAnalytics } from "./pages/admin/AdminAnalytics";
// import { AdminActivity } from "./pages/admin/AdminActivity";
// import { AdminReports } from "./pages/admin/AdminReports";
// import { AdminSettings } from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <CartProvider>
            <ProductsFilterProvider>
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/" element={<Index />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/delivery-area" element={<DeliveryArea />} />
                    <Route
                      path="/cart"
                      element={
                        <ProtectedRoute>
                          <Cart />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/legal" element={<Legal />} />
                    <Route
                      path="/checkout/address"
                      element={
                        <ProtectedRoute>
                          <CheckoutAddress />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/checkout/payment"
                      element={
                        <ProtectedRoute>
                          <CheckoutPayment />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/checkout/review"
                      element={
                        <ProtectedRoute>
                          <CheckoutReview />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/checkout/complete"
                      element={
                        <ProtectedRoute>
                          <CheckoutComplete />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile/orders"
                      element={
                        <ProtectedRoute>
                          <ProfileOrders />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile/personal"
                      element={
                        <ProtectedRoute>
                          <ProfilePersonal />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile/address"
                      element={
                        <ProtectedRoute>
                          <ProfileAddress />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile/payment"
                      element={
                        <ProtectedRoute>
                          <ProfilePayment />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile/settings"
                      element={
                        <ProtectedRoute>
                          <ProfileSettings />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Routes - COMMENTED OUT */}
                    {/* <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>}>
                <Route index element={<Overview />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="activity" element={<AdminActivity />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route> */}

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="/health" element={<HealthCheck />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </ProductsFilterProvider>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
