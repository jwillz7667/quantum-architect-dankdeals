import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { ProductGrid } from "@/components/ProductGrid";
import { CategoryRail } from "@/components/CategoryRail";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { useState } from "react";

export default function Categories() {
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 animate-fade-in">
      <DesktopHeader />
      <MobileHeader title="Categories" />

      {/* Main Content */}
      <div className="max-w-md md:max-w-7xl mx-auto px-4 md:px-6 space-y-6 pt-6 md:pt-8">
        {/* Search Bar */}
        <SearchBar
          value={searchValue}
          onChange={setSearchValue}
          onFilter={() => console.log("Open filters")}
        />

        {/* Categories Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Browse by Category</h2>
          <CategoryRail />
        </div>

        {/* All Products */}
        <ProductGrid />
        
        {/* More Products */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-foreground">Featured Products</h3>
          <ProductGrid />
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}