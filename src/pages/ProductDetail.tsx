import { ArrowLeft, Minus, Plus, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import blueDreamImg from "@/assets/blue-dream.jpg";
import prerollsImg from "@/assets/prerolls.jpg";
import wellnessImg from "@/assets/wellness.jpg";
import ediblesImg from "@/assets/edibles-hero.jpg";

// Fallback images for different categories
const categoryImages: Record<string, string> = {
  flower: blueDreamImg,
  prerolls: prerollsImg,
  wellness: wellnessImg,
  edibles: ediblesImg,
};

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string;
  thc_content: number | null;
  cbd_content: number | null;
  vendor_id: string;
  variants: ProductVariant[];
  vendor: {
    name: string;
  };
}

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  weight_grams: number;
  inventory_count: number | null;
  is_active: boolean;
}

export default function ProductDetail() {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError("Product ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('products')
          .select(`
            *,
            variants:product_variants(*),
            vendor:vendors(name)
          `)
          .eq('id', id)
          .eq('is_active', true)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          setError("Product not found");
          return;
        }

        setProduct(data);
        // Set the first available variant as default
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const handleAddToCart = () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!product || !selectedVariant) {
      return;
    }

    // Add item to cart
    addItem(product, selectedVariant, quantity);
    
    // Optionally navigate to cart or show success message
    navigate('/cart');
  };

  const getImageForProduct = (product: Product | null): string => {
    if (!product) return blueDreamImg;
    if (product.image_url) return product.image_url;
    return categoryImages[product.category] || blueDreamImg;
  };

  const formatPrice = (priceInCents: number): string => {
    return (priceInCents / 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <DesktopHeader />
        <MobileHeader title="Loading..." />
        
        <div className="aspect-[4/3] overflow-hidden relative">
          <Skeleton className="w-full h-full" />
        </div>

        <div className="max-w-md md:max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
          <div>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-6 w-1/2" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
        
        <BottomNav />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <DesktopHeader />
        <MobileHeader title="Error" />
        
        <div className="max-w-md md:max-w-7xl mx-auto px-4 md:px-6 py-6 text-center">
          <p className="text-muted-foreground">{error || "Product not found"}</p>
          <Button 
            onClick={() => navigate('/categories')} 
            className="mt-4"
          >
            Back to Products
          </Button>
        </div>
        
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 animate-fade-in">
      <DesktopHeader />
      <MobileHeader title="Product Details" />

      {/* Product Image */}
      <div className="aspect-[4/3] overflow-hidden relative">
        <img
          src={getImageForProduct(product)}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Product Info */}
      <div className="max-w-md md:max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
          {selectedVariant && (
            <p className="text-2xl font-semibold text-primary">
              ${formatPrice(selectedVariant.price)} 
              <span className="text-sm text-muted-foreground font-normal ml-1">
                {selectedVariant.name}
              </span>
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            by {product.vendor.name}
          </p>
        </div>

        {/* Product Category */}
        <div>
          <Badge variant="secondary" className="bg-primary text-primary-foreground">
            {product.category}
          </Badge>
        </div>

        {/* Description */}
        {product.description && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {/* Product Details */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">🌿</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-semibold text-accent-mint">{product.category}</p>
            </div>
          </div>
          {product.cbd_content && (
            <div>
              <p className="text-sm text-muted-foreground">CBD</p>
              <p className="font-semibold">{product.cbd_content}%</p>
            </div>
          )}
          {product.thc_content && (
            <div>
              <p className="text-sm text-muted-foreground">THC</p>
              <p className="font-semibold">{product.thc_content}%</p>
            </div>
          )}
        </div>

        {/* Variant Selector */}
        {product.variants && product.variants.length > 1 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Choose Size</h3>
            <div className="grid grid-cols-2 gap-2">
              {product.variants.map((variant) => (
                <Button
                  key={variant.id}
                  variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                  className="flex flex-col h-auto p-3"
                  onClick={() => setSelectedVariant(variant)}
                >
                  <span className="font-semibold">{variant.name}</span>
                  <span className="text-sm">${formatPrice(variant.price)}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

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
                <div className="text-sm text-muted-foreground">
                  {selectedVariant?.name || 'unit'}
                </div>
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
                <span className="text-2xl font-bold">
                  ${selectedVariant ? formatPrice(selectedVariant.price * quantity) : '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="pt-4">
          <Button variant="default" className="w-full h-14 text-lg" onClick={handleAddToCart}>
            <ShoppingCart className="w-5 h-5 mr-2" />
            Add to cart - ${selectedVariant ? formatPrice(selectedVariant.price * quantity) : '0.00'}
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}