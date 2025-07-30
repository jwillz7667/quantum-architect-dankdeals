import { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptimizedProductImage } from './OptimizedProductImage';
import { getProductImages } from '@/lib/productImages';

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
  category,
  imageUrl,
  thcContent,
}: ProductCardProps) {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    navigate(`/product/${id}`);
  }, [navigate, id]);

  const displayPrice = useMemo(
    () => (typeof price === 'number' ? price.toFixed(2) : '0.00'),
    [price]
  );

  // Get optimized images for this product
  const { displayImage } = useMemo(() => {
    const productImages = getProductImages(id, name, category);
    return { displayImage: productImages.main };
  }, [id, name, category]);

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
        <OptimizedProductImage
          src={displayImage}
          fallback={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          variant="card"
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
