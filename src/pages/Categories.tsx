import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { ProductGrid } from "@/components/ProductGrid";
import { CategoryRail } from "@/components/CategoryRail";
import { MobileHeader } from "@/components/MobileHeader";
import { useState } from "react";

export default function Categories() {
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="min-h-screen bg-background pb-20 animate-fade-in">
      <MobileHeader title="Categories" />

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