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
      variant={isActive ? "default" : "outline"}
      size="category"
      onClick={onClick}
      className={`category-card min-w-[5rem] shrink-0 ${
        isActive ? "bg-primary text-primary-foreground" : ""
      }`}
    >
      <Icon className="h-6 w-6" />
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
}