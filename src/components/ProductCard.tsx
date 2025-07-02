import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

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
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs">
              {type}
            </Badge>
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm text-foreground mb-1">{name}</h3>
          <p className="text-muted-foreground text-sm">From ${price.toFixed(2)}</p>
        </div>
      </div>
    </Link>
  );
}