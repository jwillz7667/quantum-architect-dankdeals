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
import { ArrowLeft, Check, MapPin } from '@/lib/icons';
import { toast } from 'sonner';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { formatPhoneNumber, isValidPhoneNumber } from '@/utils/phoneFormatter';
import { useAddresses } from '@/hooks/useAddresses';

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

  // Fetch saved addresses for signed-in users
  const { data: savedAddresses } = useAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);

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

  // Pre-select default address for signed-in users
  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0 && !useNewAddress) {
      const defaultAddress = savedAddresses.find((addr) => addr.is_default) || savedAddresses[0];
      if (defaultAddress && !selectedAddressId) {
        setSelectedAddressId(defaultAddress.id);
        // Pre-fill form with selected address
        setAddress({
          street: defaultAddress.street_address,
          apartment: defaultAddress.apartment || '',
          city: defaultAddress.city,
          state: defaultAddress.state,
          zipcode: defaultAddress.zip_code,
          instructions: defaultAddress.delivery_instructions || '',
        });
        setFirstName(defaultAddress.first_name);
        setLastName(defaultAddress.last_name);
        setPhone(defaultAddress.phone || '');
      }
    }
  }, [savedAddresses, useNewAddress, selectedAddressId]);

  // Handle address selection
  const handleAddressSelect = (addressId: string) => {
    const selected = savedAddresses?.find((addr) => addr.id === addressId);
    if (selected) {
      setSelectedAddressId(addressId);
      setAddress({
        street: selected.street_address,
        apartment: selected.apartment || '',
        city: selected.city,
        state: selected.state,
        zipcode: selected.zip_code,
        instructions: selected.delivery_instructions || '',
      });
      setFirstName(selected.first_name);
      setLastName(selected.last_name);
      setPhone(selected.phone || '');
    }
  };

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

      <div className="max-w-4xl mx-auto px-4 pt-8 pb-28 md:pb-12">
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

          {/* Saved Addresses - Only for signed-in users */}
          {user && savedAddresses && savedAddresses.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Saved Addresses</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUseNewAddress(!useNewAddress);
                    if (!useNewAddress) {
                      // Clear selection when switching to new address
                      setSelectedAddressId(null);
                      setAddress({
                        street: '',
                        apartment: '',
                        city: '',
                        state: 'MN',
                        zipcode: '',
                        instructions: '',
                      });
                      setFirstName('');
                      setLastName('');
                      setPhone('');
                    } else {
                      // Re-select default address
                      const defaultAddress =
                        savedAddresses.find((addr) => addr.is_default) || savedAddresses[0];
                      if (defaultAddress) {
                        handleAddressSelect(defaultAddress.id);
                      }
                    }
                  }}
                >
                  {useNewAddress ? 'Use Saved Address' : 'Use New Address'}
                </Button>
              </div>

              {!useNewAddress && (
                <RadioGroup
                  value={selectedAddressId || ''}
                  onValueChange={handleAddressSelect}
                  className="space-y-3"
                >
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                        selectedAddressId === addr.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleAddressSelect(addr.id)}
                    >
                      <RadioGroupItem value={addr.id} id={addr.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Label htmlFor={addr.id} className="font-semibold cursor-pointer">
                            {addr.label || 'Delivery Address'}
                          </Label>
                          {addr.is_default && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          <p>
                            {addr.first_name} {addr.last_name}
                          </p>
                          <p>{addr.street_address}</p>
                          {addr.apartment && <p>Apt/Unit: {addr.apartment}</p>}
                          <p>
                            {addr.city}, {addr.state} {addr.zip_code}
                          </p>
                          {addr.phone && <p>Phone: {addr.phone}</p>}
                          {addr.delivery_instructions && (
                            <p className="text-xs italic mt-1">
                              Instructions: {addr.delivery_instructions}
                            </p>
                          )}
                        </div>
                      </div>
                      {selectedAddressId === addr.id && (
                        <Check className="h-5 w-5 text-primary mt-1" />
                      )}
                    </div>
                  ))}
                </RadioGroup>
              )}

              {!useNewAddress && savedAddresses.length > 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Selected address will be used for delivery
                </p>
              )}
            </Card>
          )}

          {/* Delivery Address - Only show when using new address or no saved addresses */}
          {(useNewAddress || !user || !savedAddresses || savedAddresses.length === 0) && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {user && savedAddresses && savedAddresses.length > 0
                  ? 'New Delivery Address'
                  : 'Delivery Address'}
              </h2>
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
          )}

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
