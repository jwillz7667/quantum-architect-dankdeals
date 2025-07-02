import { Flower, Cookie, Cigarette, Heart, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { CategoryCard } from "./CategoryCard";

const categories = [
  { icon: Flower, label: "Flower", href: "/categories?type=flower" },
  { icon: Cookie, label: "Edibles", href: "/categories?type=edibles" },
  { icon: Cigarette, label: "Prerolls", href: "/categories?type=prerolls" },
  { icon: Heart, label: "Wellness", href: "/categories?type=wellness" },
  { icon: MoreHorizontal, label: "More", href: "/categories" },
];

export function CategoryRail() {
  return (
    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {categories.map((category) => (
        <Link key={category.label} to={category.href}>
          <CategoryCard
            icon={category.icon}
            label={category.label}
          />
        </Link>
      ))}
    </div>
  );
}