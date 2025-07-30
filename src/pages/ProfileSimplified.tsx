import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import { SEOHead } from '@/components/SEOHead';
import { User, Package, LogOut, ChevronRight } from '@/lib/icons';
import { toast } from 'sonner';

export default function Profile() {
  const { user, signOut } = useAuth();
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
    },
    {
      icon: User,
      label: 'Account Settings',
      description: 'Update your profile information',
      href: '/settings',
    },
  ];

  return (
    <>
      <SEOHead
        title="My Account - DankDeals MN"
        description="Manage your account settings and view order history"
        url="https://dankdealsmn.com/profile"
      />

      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <DesktopHeader />
        <MobileHeader title="Account" />

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
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
            {menuItems.map((item) => (
              <Card
                key={item.href}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(item.href)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{item.label}</h3>
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
