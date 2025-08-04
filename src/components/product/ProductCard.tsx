import { memo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ProductImage } from './ProductImage';
import { ProductPriceRange } from './ProductPrice';

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  category?: string;
  className?: string;
  priority?: boolean;
  thcContent?: number;
}

/**
 * Optimized product card component
 * - Memoized for performance
 * - Accessible navigation
 * - Responsive design
 * - SEO friendly
 */
export const ProductCard = memo(
  forwardRef<HTMLElement, ProductCardProps>(
    ({ id, name, imageUrl, category, className, priority = false }, ref) => {
      const navigate = useNavigate();

      const handleClick = () => {
        navigate(`/product/${id}`);
      };

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      };

      return (
        <article
          ref={ref}
          className={cn(
            'group relative flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden transition-all duration-200',
            'hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5',
            'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
            className
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-label={`View ${name} details`}
        >
          {/* Image Container */}
          <div className="aspect-square overflow-hidden bg-muted">
            <ProductImage
              src={imageUrl}
              alt={name}
              size="card"
              priority={priority}
              className="transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-2">
            {/* Product Name */}
            <h3 className="font-medium text-sm md:text-base line-clamp-2 text-foreground">
              {name}
            </h3>

            {/* Price Range */}
            <div className="mt-2">
              <ProductPriceRange minPrice={40} maxPrice={250} size="sm" />
            </div>
          </div>

          {/* Category indicator (subtle) */}
          {category && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs bg-background/90 backdrop-blur-sm px-2 py-1 rounded-md">
                {category}
              </span>
            </div>
          )}
        </article>
      );
    }
  )
);

ProductCard.displayName = 'ProductCard';

/**
 * Skeleton loader for ProductCard
 */
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden',
        className
      )}
    >
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="flex-1 p-4 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-6 bg-muted rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

/**
 * Horizontal product card variant
 */
export const ProductCardHorizontal = memo(
  forwardRef<HTMLElement, ProductCardProps>(({ id, name, imageUrl, category, className }, ref) => {
    const navigate = useNavigate();

    return (
      <article
        ref={ref}
        className={cn(
          'group flex gap-4 p-4 bg-card rounded-lg border border-border transition-all duration-200',
          'hover:shadow-md hover:border-primary/20',
          className
        )}
        onClick={() => navigate(`/product/${id}`)}
        role="button"
        tabIndex={0}
      >
        {/* Image */}
        <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
          <ProductImage src={imageUrl} alt={name} size="thumbnail" className="w-full h-full" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm line-clamp-2 mb-1">{name}</h3>
          {category && <p className="text-xs text-muted-foreground mb-2">{category}</p>}
          <div>
            <ProductPriceRange minPrice={40} maxPrice={250} size="sm" />
          </div>
        </div>
      </article>
    );
  })
);

ProductCardHorizontal.displayName = 'ProductCardHorizontal';
