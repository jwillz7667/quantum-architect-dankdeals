import { User, MapPin, CreditCard, Settings, LogOut, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const menuItems = [
  { icon: User, label: "Personal Information", href: "/profile/personal" },
  { icon: MapPin, label: "Delivery Address", href: "/profile/address" },
  { icon: CreditCard, label: "Payment Methods", href: "/profile/payment" },
  { icon: Phone, label: "Order History", href: "/profile/orders" },
  { icon: Settings, label: "Settings", href: "/profile/settings" },
];

interface UserProfile {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, avatar_url')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const displayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : 'Welcome Back!';

  return (
    <div className="min-h-screen bg-background pb-20 animate-fade-in">
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
          <h2 className="text-xl font-bold text-foreground mb-1">{displayName}</h2>
          <p className="text-muted-foreground">{user?.email}</p>
          <Button variant="outline" className="mt-4">
            Edit Profile
          </Button>
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
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
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </div>

        {/* App Info */}
        <div className="text-center pt-8 text-muted-foreground">
          <p className="text-sm">DankDeals MN v1.0.0</p>
          <p className="text-xs">Licensed Cannabis Dispensary</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}