import { Flower, Cookie, Cigarette, Heart, MoreHorizontal } from "lucide-react";
import { CategoryCard } from "./CategoryCard";
import { useProductsFilter } from "@/hooks/useProductsFilter";

const categories = [
  { icon: Flower, label: "Flower", category: "flower" },
  { icon: Cookie, label: "Edibles", category: "edibles" },
  { icon: Cigarette, label: "Prerolls", category: "prerolls" },
  { icon: Heart, label: "Wellness", category: "wellness" },
  { icon: MoreHorizontal, label: "All", category: null },
];

export function CategoryRail() {
  const { selectedCategory, setSelectedCategory } = useProductsFilter();

  const handleCategoryClick = (category: string | null) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  return (
    <div className="flex gap-4 overflow-x-auto md:overflow-x-visible md:justify-center snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {categories.map((category) => (
        <div key={category.label} className="shrink-0">
          <CategoryCard
            icon={category.icon}
            label={category.label}
            onClick={() => handleCategoryClick(category.category)}
            isActive={selectedCategory === category.category}
          />
        </div>
      ))}
    </div>
  );
}