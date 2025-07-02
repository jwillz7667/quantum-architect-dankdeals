import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { CategoryRail } from "@/components/CategoryRail";
import { HeroSection } from "@/components/HeroSection";
import { ProductGrid } from "@/components/ProductGrid";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";

const Index = () => {
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="DankDealsMN.com" />

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 space-y-6 pt-6">
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
        <ProductGrid />
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab="/" />
    </div>
  );
};

export default Index;
