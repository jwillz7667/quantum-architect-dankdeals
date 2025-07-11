import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/SEOHead';

export default function Cart() {
  const {
    items,
    totalItems,
    subtotal,
    taxAmount,
    deliveryFee,
    totalPrice,
    updateQuantity,
    removeItem,
    isLoading,
  } = useCart();
  const navigate = useNavigate();

  const formatPrice = (price: number) => price.toFixed(2);

  const handleCheckout = () => {
    if (items.length === 0) return;
    navigate('/checkout/address');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-32 md:pb-0">
        <DesktopHeader />
        <MobileHeader title="Shopping Cart" />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const breadcrumbs = [
    { name: 'Home', url: 'https://dankdealsmn.com' },
    { name: 'Shopping Cart', url: 'https://dankdealsmn.com/cart' },
  ];

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-0 animate-fade-in">
      <SEOHead
        title="Shopping Cart"
        description="Review your cannabis products and proceed to checkout. Same-day delivery in Minneapolis & St. Paul."
        breadcrumbs={breadcrumbs}
      />
      <DesktopHeader />
      <MobileHeader title="Shopping Cart" />

      <div className="max-w-md mx-auto px-4 pt-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">Add some products to get started</p>
            <Button onClick={() => navigate('/')} className="min-w-32">
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Your Items ({totalItems} {totalItems === 1 ? 'item' : 'items'})
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                Continue Shopping
              </Button>
            </div>

            {/* Cart Items */}
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="product-card">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <h3 className="font-semibold text-foreground text-sm leading-tight mb-1 line-clamp-2">
                              {item.name}
                            </h3>
                            <Badge variant="secondary" className="text-xs mb-1">
                              {item.category}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              {item.variant.name} • {item.variant.weight_grams}g
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-8 w-8 rounded-full"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8 rounded-full"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">
                              ${formatPrice(item.price * item.quantity)}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-xs text-muted-foreground">
                                ${formatPrice(item.price)} each
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <Card className="mt-6">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${formatPrice(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span>${formatPrice(deliveryFee)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span className="text-primary">${formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phone Order Option */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Prefer to order by phone?</p>
                  <a
                    href="tel:763-247-5378"
                    className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    763-247-5378
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Checkout Button - Fixed at Bottom */}
      {items.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t border-border md:bottom-0">
          <div className="max-w-md mx-auto">
            <Button
              onClick={handleCheckout}
              className="w-full h-12 text-lg bg-primary hover:bg-primary-hover"
            >
              Proceed to Checkout
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Free delivery on orders over $50
            </p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
