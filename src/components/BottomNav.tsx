import { Home, Grid3X3, ShoppingCart, User, MapPin, LogIn, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Grid3X3, label: "Categories", href: "/categories" },
  { icon: MapPin, label: "Delivery", href: "/delivery-area" },
  { icon: ShoppingCart, label: "Cart", href: "/cart" },
];

interface BottomNavProps {
  activeTab?: string;
}

export function BottomNav({ activeTab }: BottomNavProps) {
  const location = useLocation();
  const currentPath = activeTab || location.pathname;
  const { user } = useAuth();
  const { isAdmin } = useAdminAuth();

  return (
    <nav className="bottom-nav md:hidden">
      <div className="max-w-md mx-auto px-2 py-2">
        <div className="flex items-center justify-between">
          {/* Main navigation items */}
          <div className="flex items-center justify-around flex-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <Link key={item.href} to={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex flex-col items-center gap-1 p-2 h-auto ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <item.icon 
                      className={`h-5 w-5 transition-transform ${
                        isActive ? "scale-110" : ""
                      }`} 
                    />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Admin Dashboard - Only visible to admin users */}
          {isAdmin && (
            <Link to="/admin">
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center gap-1 p-2 h-auto ${
                  currentPath.startsWith("/admin") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Settings 
                  className={`h-5 w-5 transition-transform ${
                    currentPath.startsWith("/admin") ? "scale-110" : ""
                  }`} 
                />
                <span className="text-xs font-medium">Admin</span>
              </Button>
            </Link>
          )}

          {/* Authentication section */}
          <div className="flex items-center">
            {user ? (
              <Link to="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col items-center gap-1 p-2 h-auto ${
                    currentPath === "/profile" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <User 
                    className={`h-5 w-5 transition-transform ${
                      currentPath === "/profile" ? "scale-110" : ""
                    }`} 
                  />
                  <span className="text-xs font-medium">Account</span>
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col items-center gap-1 p-2 h-auto ${
                    currentPath === "/auth" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <LogIn 
                    className={`h-5 w-5 transition-transform ${
                      currentPath === "/auth" ? "scale-110" : ""
                    }`} 
                  />
                  <span className="text-xs font-medium">Sign In</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}