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
import {
  ShoppingCart,
  MapPin,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
}

interface PaymentInfo {
  paymentMethod: string;
  tipAmount: number;
  tipPercentage: number;
  customTip: string;
}

interface OrderDetails {
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: DeliveryInfo;
  items: Array<{
    name: string;
    variant: { name: string; weight_grams: number };
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  tipAmount: number;
  totalAmount: number;
  paymentMethod: string;
}

export default function CheckoutReview() {
  const { items, subtotal, taxAmount, deliveryFee, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);

  const tipAmount = paymentInfo?.tipAmount || 0;
  const totalAmount = subtotal + taxAmount + deliveryFee + tipAmount;

  // Load data from localStorage
  useEffect(() => {
    try {
      // Load personal info
      const savedPersonalInfo = localStorage.getItem('checkout_personal_info');
      if (!savedPersonalInfo) {
        navigate('/checkout/address');
        return;
      }
      setPersonalInfo(JSON.parse(savedPersonalInfo) as PersonalInfo);

      // Load delivery info
      const savedAddress = localStorage.getItem('delivery_address');
      if (!savedAddress) {
        navigate('/checkout/address');
        return;
      }
      setDeliveryInfo(JSON.parse(savedAddress) as DeliveryInfo);

      // Load payment info
      const savedPayment = localStorage.getItem('checkout_payment');
      if (!savedPayment) {
        navigate('/checkout/payment');
        return;
      }
      setPaymentInfo(JSON.parse(savedPayment) as PaymentInfo);
    } catch (error) {
      console.error('Error loading checkout data:', error);
      navigate('/checkout/address');
    }
  }, [navigate]);

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

  const sendOrderEmail = (orderDetails: OrderDetails) => {
    const adminEmail = 'admin@dankdealsmn.com'; // Replace with actual admin email

    const emailContent = {
      to: adminEmail,
      subject: `New Order: ${orderDetails.orderNumber}`,
      html: `
        <h2>New Cannabis Delivery Order</h2>
        <h3>Order #${orderDetails.orderNumber}</h3>
        
        <h4>Customer Information:</h4>
        <p><strong>Name:</strong> ${orderDetails.firstName} ${orderDetails.lastName}</p>
        <p><strong>Email:</strong> ${orderDetails.email}</p>
        <p><strong>Phone:</strong> ${orderDetails.phone}</p>
        <p><strong>Date of Birth:</strong> ${orderDetails.dateOfBirth}</p>
        
        <h4>Delivery Address:</h4>
        <p>${orderDetails.address.street}${orderDetails.address.apartment ? ', ' + orderDetails.address.apartment : ''}</p>
        <p>${orderDetails.address.city}, ${orderDetails.address.state} ${orderDetails.address.zipCode}</p>
        ${orderDetails.address.deliveryInstructions ? `<p><strong>Instructions:</strong> ${orderDetails.address.deliveryInstructions}</p>` : ''}
        
        <h4>Order Items:</h4>
        <ul>
          ${orderDetails.items
            .map(
              (item) => `
            <li>${item.name} - ${item.variant.name} (${item.variant.weight_grams}g) - Qty: ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>
          `
            )
            .join('')}
        </ul>
        
        <h4>Order Total:</h4>
        <p>Subtotal: $${orderDetails.subtotal.toFixed(2)}</p>
        <p>Tax: $${orderDetails.taxAmount.toFixed(2)}</p>
        <p>Delivery Fee: $${orderDetails.deliveryFee.toFixed(2)}</p>
        <p>Tip: $${orderDetails.tipAmount.toFixed(2)}</p>
        <p><strong>Total: $${orderDetails.totalAmount.toFixed(2)}</strong></p>
        
        <p><strong>Payment Method:</strong> ${orderDetails.paymentMethod}</p>
        <p><strong>Order Time:</strong> ${new Date().toLocaleString()}</p>
      `,
    };

    // In a real app, you would send this via a proper email service
    // For now, we'll log it to console
    console.log('Order email would be sent:', emailContent);

    // Store the order details in localStorage for the admin to review
    const existingOrders = JSON.parse(localStorage.getItem('admin_orders') || '[]') as Array<
      OrderDetails & { timestamp: string; status: string }
    >;
    existingOrders.push({
      ...orderDetails,
      timestamp: new Date().toISOString(),
      status: 'pending',
    });
    localStorage.setItem('admin_orders', JSON.stringify(existingOrders));
  };

  const handlePlaceOrder = () => {
    if (!agreedToTerms || !deliveryInfo || !personalInfo || !paymentInfo) return;

    setIsPlacingOrder(true);

    try {
      const orderNumber = generateOrderNumber();

      const orderDetails = {
        orderNumber,
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        email: personalInfo.email,
        phone: personalInfo.phone,
        dateOfBirth: personalInfo.dateOfBirth,
        address: deliveryInfo,
        items,
        subtotal,
        taxAmount,
        deliveryFee,
        tipAmount,
        totalAmount,
        paymentMethod: paymentInfo.paymentMethod,
      };

      // Send order details via email
      sendOrderEmail(orderDetails);

      // Clear cart and localStorage
      clearCart();
      localStorage.removeItem('checkout_personal_info');
      localStorage.removeItem('checkout_address');
      localStorage.removeItem('checkout_payment');
      localStorage.removeItem('delivery_address');

      // Navigate to success page
      navigate(`/checkout/complete?order=${orderNumber}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: 'Order Failed',
        description: 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!deliveryInfo || !personalInfo || !paymentInfo) {
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
            onClick={() => void handlePlaceOrder()}
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
