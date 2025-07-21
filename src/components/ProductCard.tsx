import { memo, useCallback, useMemo } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
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
  cbdContent?: number;
  description?: string;
}

export const ProductCard = memo(function ProductCard({
  id,
  name,
  price,
  category,
  imageUrl,
  thcContent,
  cbdContent,
  description,
}: ProductCardProps) {
  const navigate = useNavigate();

  const handleProductClick = useCallback(() => {
    navigate(`/product/${id}`);
  }, [navigate, id]);

  const handleButtonClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleProductClick();
    },
    [handleProductClick]
  );

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
    <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-200 animate-fade-in flex flex-col">
      <CardHeader className="p-0" onClick={handleProductClick}>
        <div className="aspect-square overflow-hidden rounded-t-lg">
          <OptimizedProductImage
            src={displayImage}
            fallback={imageUrl}
            alt={`${name} - Premium ${category} cannabis product`}
            className="w-full h-full hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            variant="card"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col" onClick={handleProductClick}>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold line-clamp-2 flex-1">{name}</h3>
          <Badge variant="secondary" className="ml-2 shrink-0">
            {category}
          </Badge>
        </div>

        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2 flex-1">{description}</p>
        )}

        <div className="mt-auto">
          <p className="text-2xl font-bold text-primary mb-2">${displayPrice}</p>

          {(thcContent || cbdContent) && (
            <div className="flex gap-3 text-sm">
              {thcContent && (
                <span className="text-muted-foreground">
                  THC: <span className="font-semibold text-foreground">{thcContent}%</span>
                </span>
              )}
              {cbdContent && cbdContent > 0 && (
                <span className="text-muted-foreground">
                  CBD: <span className="font-semibold text-foreground">{cbdContent}%</span>
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full hover-lift" onClick={handleButtonClick}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
});
