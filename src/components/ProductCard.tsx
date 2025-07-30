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
      className="product-card cursor-pointer group"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden rounded-md mb-3">
        <OptimizedProductImage
          src={displayImage}
          fallback={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          variant="card"
        />
      </div>

      {/* Content */}
      <div className="space-y-2 p-3">
        <h3 className="font-medium text-base line-clamp-2">{name}</h3>

        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-semibold text-primary">${displayPrice}</span>
          {thcContent && <span className="text-sm text-muted-foreground">THC {thcContent}%</span>}
        </div>
      </div>
    </article>
  );
});
