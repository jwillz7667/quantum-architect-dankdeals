import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { CategoryRail } from "@/components/CategoryRail";
import { HeroSection } from "@/components/HeroSection";
import { ProductGrid } from "@/components/ProductGrid";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, User } from "lucide-react";

const Index = () => {
  const [searchValue, setSearchValue] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleOrderAction = () => {
    if (!user) {
      navigate('/auth');
    } else {
      // User is authenticated, proceed with order action
      navigate('/cart');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="DankDealsMN.com" />

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 space-y-6 pt-6">
        
        {/* Welcome message for new users */}
        {!user && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
            <h3 className="font-semibold text-primary mb-1">Welcome to DankDeals!</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Premium cannabis delivery in Minnesota. Browse our products and create an account when ready to order.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => navigate('/auth')} className="flex-1">
                <User className="w-4 h-4 mr-1" />
                Sign Up
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/auth')} className="flex-1">
                Sign In
              </Button>
            </div>
          </div>
        )}
        {/* Search Bar */}
        <SearchBar
          value={searchValue}
          onChange={setSearchValue}
          onFilter={() => console.log("Open filters")}
        />

        {/* Categories Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Categories</h2>
          <CategoryRail />
        </div>

        {/* Hero Section */}
        <HeroSection />

        {/* Hot Products */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Featured Products</h2>
            {!user && (
              <Button size="sm" onClick={handleOrderAction}>
                <ShoppingCart className="w-4 h-4 mr-1" />
                Order Now
              </Button>
            )}
          </div>
          <ProductGrid onProductSelect={handleOrderAction} />
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab="/" />
    </div>
  );
};

export default Index;
