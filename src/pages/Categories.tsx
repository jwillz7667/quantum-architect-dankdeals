import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";
import { ProductGrid } from "@/components/ProductGrid";
import { CategoryRail } from "@/components/CategoryRail";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { SEOHead } from "@/components/SEOHead";
import { generateBreadcrumbSchema } from "@/lib/seo";
export default function Categories() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://dankdealsmn.com/' },
    { name: 'Categories', url: 'https://dankdealsmn.com/categories' }
  ]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 animate-fade-in">
      <SEOHead
        title="Cannabis Product Categories | DankDeals Minnesota"
        description="Browse our selection of premium cannabis products by category. Shop flower, edibles, pre-rolls, concentrates, and wellness products. Same-day delivery in Minneapolis & St. Paul."
        keywords="cannabis categories, marijuana products Minnesota, weed types, flower, edibles, pre-rolls, concentrates, CBD products"
        url="https://dankdealsmn.com/categories"
        structuredData={breadcrumbSchema}
      />
      <DesktopHeader />
      <MobileHeader title="Categories" />

      {/* Main Content */}
      <div className="max-w-md md:max-w-7xl mx-auto px-4 md:px-6 space-y-6 pt-6 md:pt-8">
        {/* Search Bar */}
        <SearchBar
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