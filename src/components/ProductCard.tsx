import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { SimpleImage } from './SimpleImage';
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

export function ProductCard({
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

  const handleProductClick = () => {
    navigate(`/product/${id}`);
  };

  const displayPrice = typeof price === 'number' ? price.toFixed(2) : '0.00';

  // Get optimized images for this product
  const productImages = getProductImages(id, name, category);
  const displayImage = productImages.main;

  return (
    <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-200 animate-fade-in flex flex-col">
      <CardHeader className="p-0" onClick={handleProductClick}>
        <div className="aspect-square overflow-hidden rounded-t-lg">
          <SimpleImage
            src={displayImage}
            fallback={imageUrl}
            alt={`${name} - ${category}`}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
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
        <Button
          className="w-full hover-lift"
          onClick={(e) => {
            e.stopPropagation();
            handleProductClick();
          }}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
