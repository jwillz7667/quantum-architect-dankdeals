import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, ArrowRight, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';

interface DeliveryAddress {
  street: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  deliveryInstructions: string;
}

export default function CheckoutAddress() {
  const { items, totalItems, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState<DeliveryAddress>({
    street: '',
    apartment: '',
    city: '',
    state: 'MN',
    zipCode: '',
    deliveryInstructions: '',
  });

  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidAddress, setIsValidAddress] = useState<boolean | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(5.0);
  const [estimatedTime, setEstimatedTime] = useState<string>('30-60 minutes');

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items.length, navigate]);

  // Load saved address if available
  useEffect(() => {
    const loadSavedAddress = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('delivery_address')
          .eq('user_id', user.id)
          .single();

        if (error || !data?.delivery_address) return;

        const savedAddress = data.delivery_address as DeliveryAddress;
        setAddress({
          street: savedAddress.street || '',
          apartment: savedAddress.apartment || '',
          city: savedAddress.city || '',
          state: savedAddress.state || 'MN',
          zipCode: savedAddress.zipCode || '',
          deliveryInstructions: savedAddress.deliveryInstructions || '',
        });
      } catch (error) {
        console.error('Error loading saved address:', error);
      }
    };

    void loadSavedAddress();
  }, [user]);

  const handleInputChange = (field: keyof DeliveryAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    setIsValidAddress(null);
    setValidationError(null);
  };

  const validateAddress = () => {
    setIsValidating(true);
    setValidationError(null);

    // Mock validation for now
    // In production, this would call a real address validation API
    setTimeout(() => {
      const isValid = true; // Mock: always valid for now

      if (isValid) {
        setIsValidAddress(true);
        
        // Calculate delivery fee based on location
        // Mock calculation - in real app would use actual distance/zone calculation
        if (address.city.toLowerCase() === 'minneapolis' || address.city.toLowerCase() === 'st paul') {
          setDeliveryFee(5.0);
          setEstimatedTime('30-45 minutes');
        } else {
          setDeliveryFee(10.0);
          setEstimatedTime('45-60 minutes');
        }
      } else {
        setIsValidAddress(false);
        setValidationError('Please enter a valid address within our delivery area');
      }

      setIsValidating(false);
    }, 1000);
  };

  const handleContinue = async () => {
    if (!isValidAddress) {
      validateAddress();
      return;
    }

    const addressWithFees = {
      ...address,
      deliveryFee,
      estimatedTime,
    };

    // Save address to localStorage for immediate access
    localStorage.setItem('delivery_address', JSON.stringify(addressWithFees));

    // Save address to user profile
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({
            delivery_address: addressWithFees,
          })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error saving address:', error);
      }
    }

    // Navigate to payment step
    navigate('/checkout/payment');
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <DesktopHeader />
      <MobileHeader title="Delivery Address" />

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            1
          </div>
          <div className="w-12 h-0.5 bg-muted"></div>
          <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm">
            2
          </div>
          <div className="w-12 h-0.5 bg-muted"></div>
          <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm">
            3
          </div>
        </div>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span>{totalItems} items</span>
              <span className="font-semibold">${totalPrice.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Address Form */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address *</Label>
              <Input
                id="street"
                placeholder="123 Main Street"
                value={address.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                className={validationError && !address.street ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apartment">Apartment, Suite, etc.</Label>
              <Input
                id="apartment"
                placeholder="Apt 4B (optional)"
                value={address.apartment}
                onChange={(e) => handleInputChange('apartment', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Minneapolis"
                  value={address.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={validationError && !address.city ? 'border-destructive' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value="MN" disabled className="bg-muted" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                placeholder="55401"
                value={address.zipCode}
                onChange={(e) =>
                  handleInputChange('zipCode', e.target.value.replace(/\D/g, '').substring(0, 5))
                }
                className={validationError && !address.zipCode ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Delivery Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Ring doorbell, leave at door, etc."
                value={address.deliveryInstructions}
                onChange={(e) => handleInputChange('deliveryInstructions', e.target.value)}
                className="min-h-20"
              />
            </div>

            {/* Validate Button */}
            {!isValidAddress && (
              <Button
                onClick={validateAddress}
                disabled={isValidating}
                variant="outline"
                className="w-full"
              >
                {isValidating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                    Validating Address...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Validate Address
                  </>
                )}
              </Button>
            )}

            {/* Validation Results */}
            {validationError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {isValidAddress && (
              <Alert className="border-primary bg-primary/5">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary">
                  <div className="space-y-1">
                    <p className="font-medium">Address validated! ✓</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span>Delivery fee: ${deliveryFee.toFixed(2)}</span>
                      <Separator orientation="vertical" className="h-4" />
                      <span>Est. time: {estimatedTime}</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/cart')} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
          <Button onClick={() => void handleContinue()} disabled={!isValidAddress} className="flex-1">
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
