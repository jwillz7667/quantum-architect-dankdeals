import { Flame, Leaf, Grape, Syringe, Sparkles, type LucideIcon } from '@/lib/icons';
import { CategoryCard } from './CategoryCard';
import { useProductsFilter } from '@/hooks/useProductsFilterContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface Category {
  icon: LucideIcon;
  label: string;
  category: string | null;
}

const categories: Category[] = [
  { icon: Leaf, label: 'Flower', category: 'flower' },
  { icon: Grape, label: 'Edibles', category: 'edibles' },
  { icon: Flame, label: 'Prerolls', category: 'prerolls' },
  { icon: Syringe, label: 'Topicals', category: 'topicals' },
  { icon: Sparkles, label: 'All', category: null },
];

export function CategoryRail() {
  const { selectedCategory, setSelectedCategory } = useProductsFilter();
  const navigate = useNavigate();
  const location = useLocation();

  const handleCategoryClick = (category: string | null) => {
    // Always set the category first
    setSelectedCategory(category);

    if (location.pathname === '/categories') {
      // On categories page, just update URL without a full navigation
      const params = new URLSearchParams(location.search);
      if (category) {
        params.set('category', category);
      } else {
        params.delete('category');
      }
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    } else {
      // On all other pages (including '/'), navigate to the categories page
      // with the selected filter.
      if (category) {
        navigate(`/categories?category=${category}`);
      } else {
        navigate('/categories');
      }
    }
  };

  return (
    <div className="flex justify-center">
      <div className="flex gap-3 overflow-x-auto pb-6 pt-3 px-4 scrollbar-hide max-w-fit">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.category || 'all'}
            icon={cat.icon}
            label={cat.label}
            onClick={() => handleCategoryClick(cat.category)}
            isActive={selectedCategory === cat.category}
          />
        ))}
      </div>
    </div>
  );
}
