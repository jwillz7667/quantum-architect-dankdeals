import { User, MapPin, CreditCard, Settings, LogOut, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { Link } from "react-router-dom";

const menuItems = [
  { icon: User, label: "Personal Information", href: "/profile/personal" },
  { icon: MapPin, label: "Delivery Address", href: "/profile/address" },
  { icon: CreditCard, label: "Payment Methods", href: "/profile/payment" },
  { icon: Phone, label: "Order History", href: "/profile/orders" },
  { icon: Settings, label: "Settings", href: "/profile/settings" },
];

export default function Profile() {
  return (
    <div className="min-h-screen bg-background pb-20 animate-fade-in">
      {/* Header */}
      <div className="bg-primary px-4 py-6 text-center">
        <h1 className="text-2xl font-bold text-primary-foreground">
          Profile
        </h1>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* User Info */}
        <div className="product-card p-6 text-center">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Welcome Back!</h2>
          <p className="text-muted-foreground">john.doe@example.com</p>
          <Link to="/auth">
            <Button variant="outline" className="mt-4">
              Edit Profile
            </Button>
          </Link>
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