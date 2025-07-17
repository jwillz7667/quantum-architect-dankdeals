import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { BottomNav } from '@/components/BottomNav';
import { CategoriesProductGrid } from '@/components/CategoriesProductGrid';
import { CategoryRail } from '@/components/CategoryRail';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { SEOHead } from '@/components/SEOHead';
import { useProductsFilter } from '@/hooks/useProductsFilter';
import { useProducts } from '@/hooks/useProducts';
import { generateProductListingSchema, generateBreadcrumbSchema } from '@/lib/seo';

export default function Categories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedCategory, setSelectedCategory } = useProductsFilter();
  const { products } = useProducts();

  // Sync URL params with filter state on mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && categoryParam !== selectedCategory) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams, selectedCategory, setSelectedCategory]);

  // Update URL when category changes
  useEffect(() => {
    const currentCategory = searchParams.get('category');
    if (selectedCategory !== currentCategory) {
      if (selectedCategory) {
        setSearchParams({ category: selectedCategory });
      } else {
        setSearchParams({});
      }
    }
  }, [selectedCategory, searchParams, setSearchParams]);

  const categoryDisplayName = selectedCategory
    ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
    : 'All Categories';

  const breadcrumbs = [
    { name: 'Home', url: 'https://dankdealsmn.com/' },
    { name: 'Categories', url: 'https://dankdealsmn.com/categories' },
    ...(selectedCategory
      ? [
          {
            name: categoryDisplayName,
            url: `https://dankdealsmn.com/categories?category=${selectedCategory}`,
          },
        ]
      : []),
  ];

  const pageTitle = selectedCategory
    ? `${categoryDisplayName} Cannabis Products | DankDeals Minnesota`
    : 'Cannabis Product Categories | DankDeals Minnesota';

  const pageDescription = selectedCategory
    ? `Shop premium ${selectedCategory} cannabis products. Same-day delivery in Minneapolis & St. Paul. Age 21+ only.`
    : 'Browse our selection of premium cannabis products by category. Shop flower, edibles, pre-rolls, concentrates, and wellness products. Same-day delivery in Minneapolis & St. Paul.';

  // Filter products by category for structured data
  const filteredProducts = selectedCategory
    ? products.filter((product) => product.category === selectedCategory)
    : products;

  // Generate structured data
  const productListingSchema = generateProductListingSchema(filteredProducts, selectedCategory);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 animate-fade-in">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        keywords={`cannabis categories, marijuana products Minnesota, weed types, flower, edibles, pre-rolls, concentrates, CBD products${selectedCategory ? `, ${selectedCategory}` : ''}`}
        url={`https://dankdealsmn.com/categories${selectedCategory ? `?category=${selectedCategory}` : ''}`}
        breadcrumbs={breadcrumbs}
        structuredData={[productListingSchema, breadcrumbSchema]}
      />
      <DesktopHeader />
      <MobileHeader title={selectedCategory ? categoryDisplayName : 'Categories'} />

      {/* Main Content */}
      <main className="max-w-md md:max-w-7xl mx-auto px-4 md:px-6 space-y-8 md:space-y-10 pt-6 md:pt-8">
        {/* Search Bar */}
        <SearchBar onFilter={() => console.log('Open filters')} />

        {/* Categories Section */}
        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            {selectedCategory ? `${categoryDisplayName} Products` : 'Browse by Category'}
          </h2>
          <CategoryRail />
        </div>

        {/* Products */}
        <CategoriesProductGrid />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
