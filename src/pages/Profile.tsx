import { useState, Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useOrderStats } from '@/hooks/useOrderStats';
import { Navigate } from 'react-router-dom';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import { SEOHead } from '@/components/SEOHead';
import {
  User,
  Package,
  MapPin,
  Shield,
  Bell,
  Truck,
  CheckCircle,
  DollarSign,
  Loader2,
} from '@/lib/icons';

// Lazy load profile components to reduce initial bundle size
const ProfileInfo = lazy(() =>
  import('@/components/profile/ProfileInfo').then((module) => ({ default: module.ProfileInfo }))
);
const OrderHistory = lazy(() =>
  import('@/components/profile/OrderHistory').then((module) => ({ default: module.OrderHistory }))
);
const AddressBook = lazy(() =>
  import('@/components/profile/AddressBook').then((module) => ({ default: module.AddressBook }))
);
const SecuritySettings = lazy(() =>
  import('@/components/profile/SecuritySettings').then((module) => ({
    default: module.SecuritySettings,
  }))
);
const NotificationSettings = lazy(() =>
  import('@/components/profile/NotificationSettings').then((module) => ({
    default: module.NotificationSettings,
  }))
);

// Component loading fallback
const ComponentLoader = () => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

export default function Profile() {
  const { user, loading } = useAuth();
  const {
    totalOrders,
    activeOrders,
    deliveredOrders,
    totalSpent,
    loading: statsLoading,
  } = useOrderStats();
  const [activeTab, setActiveTab] = useState('profile');

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <DesktopHeader />
        <MobileHeader title="Profile" />
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const tabItems = [
    {
      value: 'profile',
      label: 'Profile',
      icon: User,
      description: 'Personal information and preferences',
    },
    {
      value: 'orders',
      label: 'Orders',
      icon: Package,
      description: 'Order history and tracking',
    },
    {
      value: 'addresses',
      label: 'Addresses',
      icon: MapPin,
      description: 'Delivery and billing addresses',
    },
    {
      value: 'security',
      label: 'Security',
      icon: Shield,
      description: 'Password and account security',
    },
    {
      value: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Communication preferences',
    },
  ];

  return (
    <>
      <SEOHead
        title="My Profile - Account Settings & Order History"
        description="Manage your account settings, view order history, update delivery addresses, and customize your preferences."
        url="https://dankdealsmn.com/profile"
      />

      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <DesktopHeader />
        <MobileHeader title="My Profile" />

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back!</h1>
                <p className="text-muted-foreground">
                  Manage your account settings and preferences
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
            </div>
          </div>

          {/* Mobile Tab Navigation */}
          <div className="md:hidden mb-6">
            <div className="grid grid-cols-2 gap-2">
              {tabItems.slice(0, 4).map((tab) => (
                <Button
                  key={tab.value}
                  variant={activeTab === tab.value ? 'default' : 'outline'}
                  className="h-16 flex flex-col items-center justify-center"
                  onClick={() => setActiveTab(tab.value)}
                >
                  <tab.icon className="h-4 w-4 mb-1" />
                  <span className="text-xs">{tab.label}</span>
                </Button>
              ))}
            </div>
            {tabItems.length > 4 && (
              <div className="mt-2">
                <Button
                  variant={activeTab === 'notifications' ? 'default' : 'outline'}
                  className="w-full h-12 flex items-center justify-center"
                  onClick={() => setActiveTab('notifications')}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
              </div>
            )}
          </div>

          {/* Desktop Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center space-x-2"
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {tabItems.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <tab.icon className="h-5 w-5 text-primary" />
                  <div>
                    <h2 className="text-xl font-semibold">{tab.label}</h2>
                    <p className="text-sm text-muted-foreground">{tab.description}</p>
                  </div>
                </div>

                {tab.value === 'profile' && (
                  <Suspense fallback={<ComponentLoader />}>
                    <ProfileInfo />
                  </Suspense>
                )}
                {tab.value === 'orders' && (
                  <Suspense fallback={<ComponentLoader />}>
                    <OrderHistory />
                  </Suspense>
                )}
                {tab.value === 'addresses' && (
                  <Suspense fallback={<ComponentLoader />}>
                    <AddressBook />
                  </Suspense>
                )}
                {tab.value === 'security' && (
                  <Suspense fallback={<ComponentLoader />}>
                    <SecuritySettings />
                  </Suspense>
                )}
                {tab.value === 'notifications' && (
                  <Suspense fallback={<ComponentLoader />}>
                    <NotificationSettings />
                  </Suspense>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* Mobile Content */}
          <div className="md:hidden">
            {activeTab === 'profile' && (
              <Suspense fallback={<ComponentLoader />}>
                <ProfileInfo />
              </Suspense>
            )}
            {activeTab === 'orders' && (
              <Suspense fallback={<ComponentLoader />}>
                <OrderHistory />
              </Suspense>
            )}
            {activeTab === 'addresses' && (
              <Suspense fallback={<ComponentLoader />}>
                <AddressBook />
              </Suspense>
            )}
            {activeTab === 'security' && (
              <Suspense fallback={<ComponentLoader />}>
                <SecuritySettings />
              </Suspense>
            )}
            {activeTab === 'notifications' && (
              <Suspense fallback={<ComponentLoader />}>
                <NotificationSettings />
              </Suspense>
            )}
          </div>

          {/* Quick Stats Cards - Mobile Only */}
          <div className="md:hidden mt-8 grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  ) : (
                    totalOrders
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Total Orders</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Truck className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">
                  {statsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  ) : (
                    activeOrders
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Active Orders</div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats for Desktop */}
          <div className="hidden md:block mt-8">
            <div className="grid grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Package className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <div className="text-3xl font-bold">
                    {statsLoading ? (
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    ) : (
                      totalOrders
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Orders</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Truck className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <div className="text-3xl font-bold">
                    {statsLoading ? (
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    ) : (
                      activeOrders
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Orders</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-3 text-green-500" />
                  <div className="text-3xl font-bold">
                    {statsLoading ? (
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    ) : (
                      deliveredOrders
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Delivered</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-3 text-green-600" />
                  <div className="text-3xl font-bold">
                    {statsLoading ? (
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    ) : (
                      `$${totalSpent.toFixed(2)}`
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Spent</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    </>
  );
}
