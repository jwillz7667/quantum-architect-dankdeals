import { User, MapPin, CreditCard, Settings, LogOut, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
// import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const menuItems = [
  { icon: User, label: 'Personal Information', href: '/profile/personal' },
  { icon: MapPin, label: 'Delivery Address', href: '/profile/address' },
  { icon: CreditCard, label: 'Payment Methods', href: '/profile/payment' },
  { icon: Phone, label: 'Order History', href: '/profile/orders' },
  { icon: Settings, label: 'Settings', href: '/profile/settings' },
];

interface UserProfile {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  // const { isAdmin, adminUser } = useAdminAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void fetchProfile();
    }
  }, [user, fetchProfile]);

  const handleSignOut = async () => {
    await signOut();
  };

  const displayName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : // : adminUser?.firstName && adminUser?.lastName
        // ? `${adminUser.firstName} ${adminUser.lastName}`
        'Welcome Back!';

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 animate-fade-in">
      <DesktopHeader />
      <MobileHeader title="Profile" />

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* User Info */}
        <div className="product-card p-6 text-center">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-primary-foreground" />
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
            {/* {isAdmin && (
              <Badge variant="default" className="text-xs bg-primary text-primary-foreground">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )} */}
          </div>
          <p className="text-muted-foreground">{user?.email}</p>
          <Button variant="outline" className="mt-4">
            Edit Profile
          </Button>
        </div>

        {/* Admin Dashboard Access - Show first if user is admin - COMMENTED OUT */}
        {/* {isAdmin && (
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 text-purple-900">Administration</h3>
              <Button
                asChild
                className={`w-full justify-start h-14 text-left ${adminMenuItem.className}`}
                size="lg"
              >
                <Link to={adminMenuItem.href}>
                  <adminMenuItem.icon className="h-5 w-5 mr-3 text-primary" />
                  <span className="flex-1 font-medium">{adminMenuItem.label}</span>
                  <Badge variant="secondary" className="ml-auto">
                    Admin Only
                  </Badge>
                </Link>
              </Button>
            </CardContent>
          </Card>
        )} */}

        {/* Regular Menu Items */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Account
          </h3>
          {menuItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              className="w-full justify-start h-14 text-left"
              asChild
            >
              <Link to={item.href}>
                <item.icon className="h-5 w-5 mr-3 text-muted-foreground" />
                <span className="flex-1">{item.label}</span>
              </Link>
            </Button>
          ))}
        </div>

        {/* Logout */}
        <div className="pt-4">
          <Button
            variant="outline"
            className="w-full justify-start h-14 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => void handleSignOut()}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </div>

        {/* App Info */}
        <div className="text-center pt-8 text-muted-foreground">
          <p className="text-sm">DankDeals MN v1.0.0</p>
          <p className="text-xs">Licensed Cannabis Dispensary</p>
          {/* {isAdmin && (
            <p className="text-xs text-primary mt-1">Admin Access Enabled</p>
          )} */}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
