import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { OptimizedImage } from './OptimizedImage';
// import { generateProductSchema } from '@/lib/seo'; // Available if needed for structured data

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

  // Use the imageUrl from database or a placeholder
  const displayImage = imageUrl || '/api/placeholder/400/400';

  // In production, the imageUrl from database will point to /assets/products/...
  // which will be served from the public directory

  // Note: Product schema generation is available but not used in ProductCard
  // Structured data is typically only added to product detail pages, not listing cards
  // to avoid duplicate structured data on the same page.
  // If needed for a specific use case, uncomment and implement:
  /*
  const productSchema = generateProductSchema({
    id,
    name,
    description: description || '',
    price,
    category,
    thc_content: thcContent,
    cbd_content: cbdContent,
    image_url: imageUrl,
    variants: [{
      id: `${id}-default`,
      name: 'Default',
      price: price,
      inventory_count: 1
    }],
  } as any);
  */

  return (
    <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-200 animate-fade-in flex flex-col">
      <CardHeader className="p-0" onClick={handleProductClick}>
        <div className="aspect-square overflow-hidden rounded-t-lg">
          <OptimizedImage
            src={displayImage}
            alt={`${name} - ${category} cannabis product`}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            width={400}
            height={400}
            priority={false}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
