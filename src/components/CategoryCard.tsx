import type { LucideIcon } from '@/lib/icons';

interface CategoryCardProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

export function CategoryCard({ icon: Icon, label, onClick, isActive = false }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={`category-card ${
        isActive
          ? 'bg-primary text-primary-foreground scale-105'
          : 'hover:bg-primary hover:text-primary-foreground'
      }`}
      aria-pressed={isActive}
      aria-label={`${label} category${isActive ? ' - currently selected' : ''}`}
    >
      <Icon className="h-6 w-6" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
