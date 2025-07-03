import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

export function CategoryCard({ icon: Icon, label, onClick, isActive = false }: CategoryCardProps) {
  return (
    <Button
      variant="default"
      size="category"
      onClick={onClick}
      className={`category-card min-w-[5rem] shrink-0 transition-all duration-200 ${
        isActive 
          ? "bg-primary-hover shadow-md scale-105 ring-2 ring-primary ring-offset-2" 
          : "bg-primary hover:bg-primary-hover hover:scale-105 hover:shadow-md"
      }`}
      aria-pressed={isActive}
      aria-label={`${label} category${isActive ? ' - currently selected' : ''}`}
    >
      <Icon className="h-6 w-6" />
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
}