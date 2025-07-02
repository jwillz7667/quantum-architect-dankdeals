import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import blueDreamImg from "@/assets/blue-dream.jpg";

export default function ProductDetail() {
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const handleAddToCart = () => {
    if (!user) {
      navigate('/auth');
    } else {
      // Add to cart logic here
      navigate('/cart');
    }
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={blueDreamImg}
            alt="Blue Dream"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Product Info */}
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Blue Dream</h1>
          <p className="text-2xl font-semibold text-primary">$25.50 <span className="text-sm text-muted-foreground font-normal">⅛ ounce</span></p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Description</h3>
          <p className="text-muted-foreground leading-relaxed">
            Blue Dream is one of the most popular strains you can share with friends. Rolled 
            up or smoked from a bowl, these strains will be everyone's favorite take along for 
            parties or just chilling at home.
          </p>
        </div>

        {/* Product Details */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">🌿</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-semibold text-accent-mint">Hybrid</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">CBC</p>
            <p className="font-semibold">2%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">THC</p>
            <p className="font-semibold">15-27%</p>
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Choose the quantity</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                className="rounded-full"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <div className="text-2xl font-bold">{quantity}</div>
                <div className="text-sm text-muted-foreground">⅛ ounce</div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
                className="rounded-full"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">${(25.50 * quantity).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add to Cart Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-primary">
        <Button variant="cart" className="w-full h-14 text-lg" onClick={handleAddToCart}>
          »»» Add to cart
        </Button>
      </div>
    </div>
  );
}