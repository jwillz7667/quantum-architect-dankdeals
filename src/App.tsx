import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { ProductsFilterProvider } from "@/hooks/useProductsFilter";
import { CartProvider } from "@/hooks/useCart";
import { ProtectedRoute } from "@/components/ProtectedRoute";
// import { AdminRoute } from "@/components/AdminRoute";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import Auth from "./pages/Auth";
import Categories from "./pages/Categories";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import FAQ from "./pages/FAQ";
import Blog from "./pages/Blog";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Legal from "./pages/Legal";
import DeliveryArea from "./pages/DeliveryArea";
// import Admin from "./pages/Admin";
import CheckoutAddress from "./pages/checkout/CheckoutAddress";
import CheckoutPayment from "./pages/checkout/CheckoutPayment";
import CheckoutReview from "./pages/checkout/CheckoutReview";
import CheckoutComplete from "./pages/checkout/CheckoutComplete";
import ProfileOrders from "./pages/profile/ProfileOrders";
import ProfilePersonal from "./pages/profile/ProfilePersonal";
import ProfileAddress from "./pages/profile/ProfileAddress";
import ProfilePayment from "./pages/profile/ProfilePayment";
import ProfileSettings from "./pages/profile/ProfileSettings";
import NotFound from "./pages/NotFound";
import HealthCheck from "./pages/HealthCheck";

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
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/delivery-area" element={<DeliveryArea />} />
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/checkout/address" element={<ProtectedRoute><CheckoutAddress /></ProtectedRoute>} />
              <Route path="/checkout/payment" element={<ProtectedRoute><CheckoutPayment /></ProtectedRoute>} />
              <Route path="/checkout/review" element={<ProtectedRoute><CheckoutReview /></ProtectedRoute>} />
              <Route path="/checkout/complete" element={<ProtectedRoute><CheckoutComplete /></ProtectedRoute>} />
              <Route path="/profile/orders" element={<ProtectedRoute><ProfileOrders /></ProtectedRoute>} />
              <Route path="/profile/personal" element={<ProtectedRoute><ProfilePersonal /></ProtectedRoute>} />
              <Route path="/profile/address" element={<ProtectedRoute><ProfileAddress /></ProtectedRoute>} />
              <Route path="/profile/payment" element={<ProtectedRoute><ProfilePayment /></ProtectedRoute>} />
              <Route path="/profile/settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
              
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
              </BrowserRouter>
            </ProductsFilterProvider>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
