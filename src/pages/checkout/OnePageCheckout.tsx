import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [address, setAddress] = useState<DeliveryAddress>({
    street: '',
    apartment: '',
    city: 'Minneapolis',
    state: 'MN',
    zipcode: '',
    instructions: '',
  });

  const [paymentMethod] = useState('cash');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');

  const subtotal = Number(cartSubtotal) || 0;
  const deliveryFee = 5.0;
  const tax = subtotal * 0.0875; // Minnesota tax rate
  const finalTotal = subtotal + deliveryFee + tax;

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.street || !address.zipcode || !phone || !name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order in database
      const orderData = {
        user_id: user?.id || null,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        delivery_address: JSON.stringify(address),
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        tax: tax,
        total: finalTotal,
        payment_method: paymentMethod,
        status: 'pending',
        items: items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
        })),
      };

      const { data: order, error } = (await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()) as { data: { id: string } | null; error: Error | null };

      if (error) throw error;

      // Clear cart and redirect to success page
      clearCart();
      if (order) {
        navigate('/checkout/complete', {
          state: {
            orderId: order.id,
            orderNumber: `DD-${order.id.slice(0, 8).toUpperCase()}`,
          },
        });
      }

      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Checkout - DankDeals MN"
        description="Complete your cannabis order for same-day delivery in Minneapolis"
      />

      <DesktopHeader />
      <MobileHeader title="Checkout" />

      <div className="max-w-4xl mx-auto px-4 py-8">
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
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                />
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
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  placeholder="123 Main St"
                  required
                />
              </div>
              <div>
                <Label htmlFor="apartment">Apartment/Suite (optional)</Label>
                <Input
                  id="apartment"
                  value={address.apartment}
                  onChange={(e) => setAddress({ ...address, apartment: e.target.value })}
                  placeholder="Apt 4B"
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    readOnly
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={address.state} readOnly />
                </div>
                <div>
                  <Label htmlFor="zipcode">ZIP Code *</Label>
                  <Input
                    id="zipcode"
                    value={address.zipcode}
                    onChange={(e) => setAddress({ ...address, zipcode: e.target.value })}
                    placeholder="55401"
                    maxLength={5}
                    required
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
            <RadioGroup value={paymentMethod} disabled>
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
