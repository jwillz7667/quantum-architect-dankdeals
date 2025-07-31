import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RobustProductImage } from './RobustProductImage';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  thcContent?: number;
}

export const ProductCard = memo(function ProductCard({
  id,
  name,
  price,
  category: _category,
  imageUrl,
  thcContent,
}: ProductCardProps) {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    navigate(`/product/${id}`);
  }, [navigate, id]);

  const displayPrice = typeof price === 'number' ? price.toFixed(2) : '0.00';

  return (
    <article
      className="product-card cursor-pointer group h-full flex flex-col"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
        <RobustProductImage
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          aspectRatio="1/1"
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-3 space-y-2">
        <h3 className="font-medium text-sm md:text-base line-clamp-2 text-foreground">{name}</h3>

        <div className="flex flex-col gap-1">
          <span className="text-lg md:text-xl font-bold text-primary">${displayPrice}</span>
          {thcContent && <span className="text-xs text-muted-foreground">THC {thcContent}%</span>}
        </div>
      </div>
    </article>
  );
});
