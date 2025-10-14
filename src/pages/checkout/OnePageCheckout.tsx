import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Check } from '@/lib/icons';
import { toast } from 'sonner';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { formatPhoneNumber, isValidPhoneNumber } from '@/utils/phoneFormatter';

interface DeliveryAddress {
  street: string;
  apartment: string;
  city: string;
  state: string;
  zipcode: string;
  instructions: string;
}

export default function OnePageCheckout() {
  const navigate = useNavigate();
  const { items, subtotal: cartSubtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { trackBeginCheckout, trackPurchase } = useAnalytics();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [address, setAddress] = useState<DeliveryAddress>({
    street: '',
    apartment: '',
    city: '',
    state: 'MN',
    zipcode: '',
    instructions: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'aeropay' | 'stronghold'>('cash');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');

  const subtotal = Number(cartSubtotal) || 0;
  const deliveryFee = 5.0;
  const tax = subtotal * 0.0875; // Minnesota tax rate
  const finalTotal = subtotal + deliveryFee + tax;

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    } else {
      // Track checkout begin when user lands on checkout page
      trackBeginCheckout(items, finalTotal);
    }
  }, [items, navigate, trackBeginCheckout, finalTotal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.street || !address.zipcode || !phone || !firstName || !lastName || !email) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate email (now required)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate phone
    if (!isValidPhoneNumber(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare order data for edge function
      const orderData = {
        customer_name: `${firstName} ${lastName}`,
        customer_email: email,
        customer_phone: phone,
        delivery_first_name: firstName,
        delivery_last_name: lastName,
        delivery_address: {
          street: address.street,
          apartment: address.apartment,
          city: address.city,
          state: address.state,
          zipcode: address.zipcode,
          instructions: address.instructions,
        },
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        tax: tax,
        total: finalTotal,
        payment_method: paymentMethod,
        items: items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          weight: item.variant?.weight_grams || 3.5,
        })),
        user_id: user?.id || null,
      };

      // Call edge function to create order
      type CreateOrderResponse = {
        success: boolean;
        error?: string;
        order?: {
          id: string;
          order_number: string;
          status: string;
          total: number;
        };
      };

      const response = await supabase.functions.invoke<CreateOrderResponse>('process-order', {
        body: orderData,
      });

      const data = response.data;
      const error = response.error as Error | null;

      if (error) {
        console.error('Edge function error:', error);
        console.error('Full response:', response);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
        throw new Error(errorMessage);
      }

      if (!data?.success || !data?.order) {
        throw new Error(data?.error || 'Order creation failed');
      }

      // If paying with cash, finish locally. If Aeropay/Stronghold, redirect to provider checkout
      if (paymentMethod === 'cash') {
        trackPurchase(data.order.order_number, items, data.order.total, tax, deliveryFee);
        clearCart();
        navigate(`/checkout/complete?order=${encodeURIComponent(data.order.order_number)}`, {
          state: {
            orderId: data.order.id,
            orderNumber: data.order.order_number,
            total: data.order.total,
          },
        });
      } else if (paymentMethod === 'aeropay') {
        const aero = await supabase.functions.invoke<{ url?: string; error?: string }>(
          'payments-aeropay-create-session',
          {
            body: { order_id: data.order.id },
          }
        );
        if (aero.error || !aero.data?.url) {
          const message = aero.data?.error ?? 'Failed to init Aeropay';
          throw new Error(message);
        }
        window.location.href = aero.data.url;
      } else if (paymentMethod === 'stronghold') {
        const sh = await supabase.functions.invoke<{ url?: string; error?: string }>(
          'payments-stronghold-create-session',
          {
            body: { order_id: data.order.id },
          }
        );
        if (sh.error || !sh.data?.url) {
          const message = sh.data?.error ?? 'Failed to init Stronghold';
          throw new Error(message);
        }
        window.location.href = sh.data.url;
      }

      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to place order. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <SEOHead
        title="Checkout - DankDeals MN"
        description="Complete your cannabis order for same-day delivery in Minneapolis"
      />

      <DesktopHeader />
      <MobileHeader title="Checkout" />

      <div className="max-w-4xl mx-auto px-4 pt-8 pb-24">
        {/* Back to Cart */}
        <Button variant="ghost" onClick={() => navigate('/cart')} className="mb-6 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Button>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8">
          {/* Contact Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setPhone(formatted);
                    }}
                    placeholder="555-123-4567"
                    maxLength={12}
                    required
                    autoComplete="tel"
                  />
                  {phone && !isValidPhoneNumber(phone) && (
                    <p className="text-sm text-red-500 mt-1">
                      Please enter a valid 10-digit phone number
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Delivery Address */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  name="street"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  placeholder="123 Main St"
                  required
                  autoComplete="street-address"
                />
              </div>
              <div>
                <Label htmlFor="apartment">Apartment/Suite (optional)</Label>
                <Input
                  id="apartment"
                  name="apartment"
                  value={address.apartment}
                  onChange={(e) => setAddress({ ...address, apartment: e.target.value })}
                  placeholder="Apt 4B"
                  autoComplete="address-line2"
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="Enter your city"
                    required
                    autoComplete="address-level2"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={address.state}
                    readOnly
                    autoComplete="address-level1"
                  />
                </div>
                <div>
                  <Label htmlFor="zipcode">ZIP Code *</Label>
                  <Input
                    id="zipcode"
                    name="zipcode"
                    value={address.zipcode}
                    onChange={(e) => setAddress({ ...address, zipcode: e.target.value })}
                    placeholder="55401"
                    maxLength={5}
                    required
                    autoComplete="postal-code"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="instructions">Delivery Instructions (optional)</Label>
                <Input
                  id="instructions"
                  value={address.instructions}
                  onChange={(e) => setAddress({ ...address, instructions: e.target.value })}
                  placeholder="Leave at door, ring doorbell"
                />
              </div>
            </div>
          </Card>

          {/* Payment Method */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v: string) =>
                setPaymentMethod(v as 'cash' | 'aeropay' | 'stronghold')
              }
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2 p-4 border rounded-lg bg-secondary/50">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-sm text-muted-foreground">
                        Pay your delivery driver in cash
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg opacity-90">
                  <RadioGroupItem value="aeropay" id="aeropay" />
                  <Label htmlFor="aeropay" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">Aeropay (Bank Transfer)</p>
                      <p className="text-sm text-muted-foreground">
                        Secure bank payment via Aeropay
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg opacity-90">
                  <RadioGroupItem value="stronghold" id="stronghold" />
                  <Label htmlFor="stronghold" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium">Stronghold (ACH)</p>
                      <p className="text-sm text-muted-foreground">Pay via Stronghold ACH</p>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </Card>

          {/* Order Summary */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator className="my-4" />
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between text-xl font-semibold">
                <span>Total</span>
                <span className="text-primary">${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <Button type="submit" size="lg" className="w-full btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              'Processing...'
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                Place Order - ${finalTotal.toFixed(2)}
              </>
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            By placing this order, you confirm that you are 21 years or older and agree to our terms
            of service.
          </p>
        </form>
      </div>
    </div>
  );
}
