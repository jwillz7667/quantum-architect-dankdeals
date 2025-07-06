import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { sendOrderConfirmationEmail } from '@/lib/email';
import {
  ShoppingCart,
  MapPin,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';

export default function CheckoutReview() {
  const { items, subtotal, taxAmount, deliveryFee, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  interface DeliveryInfo {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    deliveryInstructions?: string;
    deliveryFee: number;
    estimatedTime: string;
  }

  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);

  // For this demo, we'll assume tip is 18% (would be stored from payment step)
  const tipAmount = subtotal * 0.18;
  const totalAmount = subtotal + taxAmount + deliveryFee + tipAmount;

  // Load delivery info
  useEffect(() => {
    const loadDeliveryInfo = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('delivery_address')
          .eq('user_id', user.id)
          .single();

        if (error || !data?.delivery_address) {
          navigate('/checkout/address');
          return;
        }

        setDeliveryInfo(data.delivery_address as DeliveryInfo);
      } catch (error) {
        console.error('Error loading delivery info:', error);
        navigate('/checkout/address');
      }
    };

    void loadDeliveryInfo();
  }, [user, navigate]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items.length, navigate]);

  const generateOrderNumber = () => {
    const prefix = 'DD';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  };

  const handlePlaceOrder = async () => {
    if (!agreedToTerms) return;

    setIsPlacingOrder(true);

    try {
      const orderNumber = generateOrderNumber();

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user?.id || '',
          order_number: orderNumber,
          delivery_address: deliveryInfo,
          subtotal: subtotal,
          tax_amount: taxAmount,
          delivery_fee: deliveryFee,
          tip_amount: tipAmount,
          total_amount: totalAmount,
          total_weight_grams: items.reduce(
            (total, item) => total + item.variant.weight_grams * item.quantity,
            0
          ),
          status: 'pending',
          payment_status: 'pending',
          vendor_id: 'default-vendor', // In real app, this would be dynamic
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) throw itemsError;

      // Send confirmation email
      await sendOrderConfirmationEmail({
        to: user!.email!,
        orderNumber: orderNumber,
        totalAmount: totalAmount,
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryAddress: deliveryInfo,
      });

      // Clear cart
      clearCart();

      // Navigate to success page
      navigate(`/checkout/complete?order=${orderNumber}`);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!deliveryInfo) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <DesktopHeader />
        <MobileHeader title="Review Order" />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-0">
      <DesktopHeader />
      <MobileHeader title="Review Order" />

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            ✓
          </div>
          <div className="w-12 h-0.5 bg-primary"></div>
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            ✓
          </div>
          <div className="w-12 h-0.5 bg-primary"></div>
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            3
          </div>
        </div>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="w-5 h-5" />
              Your Order ({items.length} {items.length === 1 ? 'item' : 'items'})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 p-3 rounded-lg border border-border">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm leading-tight mb-1">{item.name}</h4>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{item.variant.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Delivery Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <p className="font-medium">
                {deliveryInfo.street} {deliveryInfo.apartment}
              </p>
              <p className="text-muted-foreground">
                {deliveryInfo.city}, {deliveryInfo.state} {deliveryInfo.zipCode}
              </p>
              {deliveryInfo.deliveryInstructions && (
                <p className="text-muted-foreground italic">
                  "{deliveryInfo.deliveryInstructions}"
                </p>
              )}
              <div className="flex items-center gap-2 pt-2">
                <Clock className="w-4 h-4" />
                <span className="text-muted-foreground">
                  Est. delivery: {deliveryInfo.estimatedTime}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                💵
              </div>
              <div>
                <p className="font-medium">Cash on Delivery</p>
                <p className="text-sm text-muted-foreground">Pay when your order arrives</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Total */}
        <Card>
          <CardHeader>
            <CardTitle>Order Total</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Delivery Fee</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Driver Tip (18%)</span>
              <span>${tipAmount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="text-primary">${totalAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Terms Agreement */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed">
                I agree to the{' '}
                <a href="/terms" className="text-primary underline">
                  Terms of Service
                </a>{' '}
                and confirm that I am 21+ years old. I understand that cannabis products are for
                adult use only and will provide valid ID upon delivery.
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Legal Notice */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Minnesota Cannabis Notice:</strong> This product has not been analyzed or
            approved by the FDA. Keep out of reach of children and pets. Do not operate vehicles or
            machinery after use.
          </AlertDescription>
        </Alert>

        {/* Navigation */}
        <div className="flex gap-3 pb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/checkout/payment')}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handlePlaceOrder}
            disabled={!agreedToTerms || isPlacingOrder}
            className="flex-1"
          >
            {isPlacingOrder ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                Placing Order...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Place Order
              </>
            )}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
