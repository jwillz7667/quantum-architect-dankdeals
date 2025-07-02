import { Home, Grid3X3, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Grid3X3, label: "Categories", href: "/categories" },
  { icon: ShoppingCart, label: "Cart", href: "/cart" },
  { icon: User, label: "Profile", href: "/profile" },
];

interface BottomNavProps {
  activeTab?: string;
}

export function BottomNav({ activeTab = "/" }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = activeTab === item.href;
            return (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center gap-1 p-2 h-auto ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => console.log(`Navigate to ${item.href}`)}
              >
                <item.icon 
                  className={`h-5 w-5 transition-transform ${
                    isActive ? "scale-110" : ""
                  }`} 
                />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}