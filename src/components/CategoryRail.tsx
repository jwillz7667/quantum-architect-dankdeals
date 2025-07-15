import { Flower, Cookie, Cigarette, Heart, MoreHorizontal } from 'lucide-react';
import { CategoryCard } from './CategoryCard';
import { useProductsFilter } from '@/hooks/useProductsFilter';
import { useNavigate, useLocation } from 'react-router-dom';

const categories = [
  { icon: Flower, label: 'Flower', category: 'flower' },
  { icon: Cookie, label: 'Edibles', category: 'edibles' },
  { icon: Cigarette, label: 'Prerolls', category: 'prerolls' },
  { icon: Heart, label: 'Topicals', category: 'topicals' },
  { icon: MoreHorizontal, label: 'All', category: null },
];

export function CategoryRail() {
  const { selectedCategory, setSelectedCategory } = useProductsFilter();
  const navigate = useNavigate();
  const location = useLocation();

  const handleCategoryClick = (category: string | null) => {
    if (location.pathname === '/categories') {
      // On categories page, just filter and update URL
      setSelectedCategory(category);
      const params = new URLSearchParams(location.search);
      if (category) {
        params.set('category', category);
      } else {
        params.delete('category');
      }
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    } else if (location.pathname === '/') {
      // On home page, navigate to categories with filter
      setSelectedCategory(category);
      if (category) {
        navigate(`/categories?category=${category}`);
      } else {
        navigate('/categories');
      }
    } else {
      // On other pages, just set filter without navigation
      setSelectedCategory(category);
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-3 pt-1 px-4 scrollbar-hide">
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
  );
}
