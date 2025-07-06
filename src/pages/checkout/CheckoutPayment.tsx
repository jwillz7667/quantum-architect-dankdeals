import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, DollarSign, ArrowRight, ArrowLeft, Info, MapPin, Clock } from 'lucide-react';

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

const TIP_OPTIONS = [
  { label: '15%', value: 0.15 },
  { label: '18%', value: 0.18 },
  { label: '20%', value: 0.2 },
  { label: 'Custom', value: 0 },
  { label: 'No tip', value: 0 },
];

export default function CheckoutPayment() {
  const { items, subtotal, taxAmount, deliveryFee } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [tipPercentage, setTipPercentage] = useState<number>(0.18);
  const [customTip, setCustomTip] = useState<string>('');
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);

  const tipAmount = tipPercentage > 0 ? subtotal * tipPercentage : parseFloat(customTip) || 0;
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
          // Redirect back to address if no address found
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

  const handleTipChange = (value: string) => {
    const tipOption = TIP_OPTIONS.find((option) => option.label === value);
    if (tipOption) {
      if (tipOption.label === 'Custom') {
        setTipPercentage(0);
        setCustomTip('');
      } else {
        setTipPercentage(tipOption.value);
        setCustomTip('');
      }
    }
  };

  const handleCustomTipChange = (value: string) => {
    // Only allow positive numbers
    const numericValue = value.replace(/[^\d.]/g, '');
    setCustomTip(numericValue);
    setTipPercentage(0);
  };

  const handleContinue = () => {
    // Save payment method and tip info, then proceed to review
    // In a real app, you'd save this to session or context
    // For now, we'll just navigate to review
    navigate('/checkout/review');
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!deliveryInfo) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <DesktopHeader />
        <MobileHeader title="Payment" />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <DesktopHeader />
      <MobileHeader title="Payment" />

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            ✓
          </div>
          <div className="w-12 h-0.5 bg-primary"></div>
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            2
          </div>
          <div className="w-12 h-0.5 bg-muted"></div>
          <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm">
            3
          </div>
        </div>

        {/* Delivery Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5" />
              Delivery Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <p className="font-medium">
                {deliveryInfo.street} {deliveryInfo.apartment}
              </p>
              <p className="text-muted-foreground">
                {deliveryInfo.city}, {deliveryInfo.state} {deliveryInfo.zipCode}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{deliveryInfo.estimatedTime}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <span>Fee: ${deliveryInfo.deliveryFee.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value: 'cash' | 'card') => setPaymentMethod(value)}
            >
              <div className="flex items-center space-x-2 p-3 rounded-lg border border-border">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-sm text-muted-foreground">
                        Pay with cash when your order arrives
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg border border-border opacity-60">
                <RadioGroupItem value="card" id="card" disabled />
                <Label htmlFor="card" className="flex-1 cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-muted-foreground">Credit/Debit Card</p>
                      <p className="text-sm text-muted-foreground">Coming soon</p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {paymentMethod === 'cash' && (
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Please have exact change ready. Our drivers carry limited cash for change.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Tip Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Add a Tip for Your Driver</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={
                tipPercentage > 0
                  ? TIP_OPTIONS.find((opt) => opt.value === tipPercentage)?.label
                  : customTip
                    ? 'Custom'
                    : 'No tip'
              }
              onValueChange={handleTipChange}
            >
              <div className="grid grid-cols-3 gap-2">
                {TIP_OPTIONS.map((option) => (
                  <div key={option.label} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.label} id={option.label} />
                    <Label htmlFor={option.label} className="text-sm cursor-pointer">
                      {option.label}
                      {option.value > 0 && (
                        <div className="text-xs text-muted-foreground">
                          ${(subtotal * option.value).toFixed(2)}
                        </div>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            {tipPercentage === 0 &&
              (!TIP_OPTIONS.find((opt) => opt.label === 'No tip' && opt.value === 0) ||
                customTip !== '') && (
                <div className="space-y-2">
                  <Label htmlFor="customTip">Custom Tip Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="customTip"
                      type="text"
                      placeholder="0.00"
                      value={customTip}
                      onChange={(e) => handleCustomTipChange(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
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
            {tipAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span>Driver Tip</span>
                <span>${tipAmount.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="text-primary">${totalAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/checkout/address')}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleContinue} className="flex-1">
            Review Order
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
