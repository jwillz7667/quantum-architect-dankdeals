import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { OptimizedImage } from "@/components/OptimizedImage";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  type: string;
  image: string;
}

export function ProductCard({ id, name, price, type, image }: ProductCardProps) {
  return (
    <Link to={`/product/${id}`}>
      <div className="product-card cursor-pointer">
        <div className="relative aspect-square overflow-hidden">
          <OptimizedImage
            src={image}
            alt={`${name} - ${type} cannabis product`}
            className="w-full h-full object-cover"
            width="100%"
            height="100%"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          />
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs">
              {type}
            </Badge>
          </div>
        </div>
        <div className="p-3 h-16 flex flex-col justify-between">
          <h3 className="font-semibold text-sm text-foreground mb-1 line-clamp-2">{name}</h3>
          <p className="text-muted-foreground text-sm">From ${price.toFixed(2)}</p>
        </div>
      </div>
    </Link>
  );
}