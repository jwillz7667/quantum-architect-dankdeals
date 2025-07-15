import { useNavigate } from 'react-router-dom';
import { OptimizedProductImage } from './OptimizedProductImage';
import { getProductImages } from '@/lib/productImages';

interface SimpleProductCardProps {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
}

export function SimpleProductCard({ id, name, category, imageUrl }: SimpleProductCardProps) {
  const navigate = useNavigate();

  const handleProductClick = () => {
    navigate(`/product/${id}`);
  };

  // Get optimized images for this product
  const productImages = getProductImages(id, name, category);
  const displayImage = productImages.main;

  return (
    <div className="flex-shrink-0 cursor-pointer" onClick={handleProductClick}>
      <div className="w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden mb-2">
        <OptimizedProductImage
          src={displayImage}
          fallback={imageUrl}
          alt={`${name} - Premium ${category} cannabis product`}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
          sizes="(max-width: 640px) 128px, 160px"
        />
      </div>
      <h3 className="text-sm font-medium text-foreground line-clamp-2 px-1">{name}</h3>
    </div>
  );
}
