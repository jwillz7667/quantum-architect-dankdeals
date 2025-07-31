import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProductBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

/**
 * Product-specific badge component
 */
export function ProductBadge({ children, variant = 'secondary', className }: ProductBadgeProps) {
  return (
    <Badge variant={variant} className={cn('text-xs', className)}>
      {children}
    </Badge>
  );
}

interface THCBadgeProps {
  percentage: number;
  className?: string;
}

/**
 * THC percentage badge
 */
export function THCBadge({ percentage, className }: THCBadgeProps) {
  return (
    <ProductBadge className={cn('bg-orange-100 text-orange-800', className)}>
      THC {percentage}%
    </ProductBadge>
  );
}

interface CBDBadgeProps {
  percentage: number;
  className?: string;
}

/**
 * CBD percentage badge
 */
export function CBDBadge({ percentage, className }: CBDBadgeProps) {
  return (
    <ProductBadge className={cn('bg-blue-100 text-blue-800', className)}>
      CBD {percentage}%
    </ProductBadge>
  );
}

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

/**
 * Product category badge
 */
export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const categoryColors = {
    flower: 'bg-green-100 text-green-800',
    edibles: 'bg-purple-100 text-purple-800',
    concentrates: 'bg-amber-100 text-amber-800',
    vapes: 'bg-blue-100 text-blue-800',
    accessories: 'bg-gray-100 text-gray-800',
  };

  const color =
    categoryColors[category as keyof typeof categoryColors] || categoryColors.accessories;

  return <ProductBadge className={cn(color, className)}>{category}</ProductBadge>;
}

interface StrainTypeBadgeProps {
  type: 'indica' | 'sativa' | 'hybrid';
  className?: string;
}

/**
 * Strain type badge
 */
export function StrainTypeBadge({ type, className }: StrainTypeBadgeProps) {
  const typeConfig = {
    indica: { color: 'bg-purple-100 text-purple-800', emoji: '🌙' },
    sativa: { color: 'bg-yellow-100 text-yellow-800', emoji: '☀️' },
    hybrid: { color: 'bg-green-100 text-green-800', emoji: '🌿' },
  };

  const config = typeConfig[type];

  return (
    <ProductBadge className={cn(config.color, className)}>
      {config.emoji} {type}
    </ProductBadge>
  );
}
