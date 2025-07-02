import { Flower, Cookie, Cigarette, Heart, MoreHorizontal } from "lucide-react";
import { CategoryCard } from "./CategoryCard";

const categories = [
  { icon: Flower, label: "Flower" },
  { icon: Cookie, label: "Edibles" },
  { icon: Cigarette, label: "Prerolls" },
  { icon: Heart, label: "Wellness" },
  { icon: MoreHorizontal, label: "More" },
];

export function CategoryRail() {
  return (
    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hidden pb-2">
      {categories.map((category) => (
        <CategoryCard
          key={category.label}
          icon={category.icon}
          label={category.label}
          onClick={() => console.log(`Navigate to ${category.label}`)}
        />
      ))}
    </div>
  );
}