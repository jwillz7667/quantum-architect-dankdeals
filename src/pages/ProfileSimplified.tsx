import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Navigate, useNavigate } from 'react-router-dom';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import { SEOHead } from '@/components/SEOHead';
import { User, Package, LogOut, ChevronRight, Shield } from '@/lib/icons';
import { toast } from 'sonner';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      navigate('/');
      toast.success('Signed out successfully');
    } catch (_error) {
      toast.error('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems = [
    {
      icon: Package,
      label: 'Order History',
      description: 'View your past orders',
      href: '/orders',
      showForAll: true,
    },
    {
      icon: User,
      label: 'Account Settings',
      description: 'Update your profile information',
      href: '/settings',
      showForAll: true,
    },
    {
      icon: Shield,
      label: 'Admin Dashboard',
      description: 'Manage products, orders, and users',
      href: '/admin',
      showForAll: false, // Only shown to admins
      adminOnly: true,
    },
  ];

  return (
    <>
      <SEOHead
        title="My Account - DankDeals MN"
        description="Manage your account settings and view order history"
        url="https://dankdealsmn.com/profile"
      />

      <div className="min-h-screen bg-background pb-32 md:pb-0">
        <DesktopHeader />
        <MobileHeader title="Account" />

        <div className="max-w-2xl mx-auto px-4 pt-8 pb-24 space-y-6">
          {/* User Info Card */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-semibold">Welcome back!</h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-secondary rounded-md">
                <p className="text-2xl font-semibold">0</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
              <div className="text-center p-4 bg-secondary rounded-md">
                <p className="text-2xl font-semibold">Member</p>
                <p className="text-sm text-muted-foreground">Status</p>
              </div>
            </div>
          </Card>

          {/* Menu Options */}
          <div className="space-y-3">
            {menuItems
              .filter((item) => item.showForAll || (item.adminOnly && isAdmin))
              .map((item) => (
                <Card
                  key={item.href}
                  className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                    item.adminOnly ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => navigate(item.href)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-md flex items-center justify-center ${
                          item.adminOnly ? 'bg-primary/20' : 'bg-primary/10'
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 ${item.adminOnly ? 'text-primary' : 'text-primary'}`}
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {item.label}
                          {item.adminOnly && (
                            <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              Admin
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Card>
              ))}
          </div>

          {/* Contact Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Need Help?</h2>
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-muted-foreground">Customer Support</Label>
                <p className="font-medium">763-247-5378</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="font-medium">support@dankdealsmn.com</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Hours</Label>
                <p className="font-medium">Mon-Sun: 10:00 AM - 10:00 PM</p>
              </div>
            </div>
          </Card>

          {/* Sign Out Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => void handleSignOut()}
            disabled={isLoading}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoading ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>

        <BottomNav />
      </div>
    </>
  );
}
