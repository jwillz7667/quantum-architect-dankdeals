import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { OptimizedImage } from './OptimizedImage';

// Import new product images
import pineappleFruz1 from '@/assets/products/pineapple-fruz/pineapple-fruz-1.jpeg';
import rs11_1 from '@/assets/products/rs11/rainbow-sherbert11-1.jpeg';
import runtz1 from '@/assets/products/runtz/runtz-1.jpeg';
import weddingCake1 from '@/assets/products/wedding-cake/wedding-cake-1.jpeg';

// Map product IDs to their local images
const productImageMap: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': pineappleFruz1,
  '22222222-2222-2222-2222-222222222222': rs11_1,
  '33333333-3333-3333-3333-333333333333': runtz1,
  '44444444-4444-4444-4444-444444444444': weddingCake1,
};

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

  const displayPrice = typeof price === 'number' ? (price / 100).toFixed(2) : '0.00';

  // Use local image if available, otherwise fallback to provided imageUrl
  const displayImage = productImageMap[id] || imageUrl || '/api/placeholder/400/400';

  return (
    <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-200 animate-fade-in">
      <CardHeader className="p-0" onClick={handleProductClick}>
        <div className="aspect-square overflow-hidden">
          <OptimizedImage
            src={displayImage}
            alt={`${name} - ${category} cannabis product`}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            width={400}
            height={400}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4" onClick={handleProductClick}>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold line-clamp-2 flex-1">{name}</h3>
          <Badge variant="secondary" className="ml-2 shrink-0">
            {category}
          </Badge>
        </div>

        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{description}</p>
        )}

        <p className="text-2xl font-bold text-primary">${displayPrice}</p>

        {(thcContent || cbdContent) && (
          <div className="mt-2 flex gap-3 text-sm">
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
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            handleProductClick();
          }}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
