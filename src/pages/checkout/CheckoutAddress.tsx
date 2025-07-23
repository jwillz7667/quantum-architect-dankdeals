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
import { MapPin, ArrowRight, ArrowLeft, AlertTriangle, CheckCircle, User } from 'lucide-react';
import { sanitizeText, sanitizeEmail, sanitizePhone, sanitizeZipCode } from '@/lib/sanitize';
import { getCSRFToken, validateCSRFToken } from '@/lib/csrf';

interface DeliveryAddress {
  street: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  deliveryInstructions: string;
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
}

export default function CheckoutAddress() {
  const { items, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
  });

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
  const [csrfToken, setCsrfToken] = useState<string>('');

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items.length, navigate]);

  // Initialize CSRF token
  useEffect(() => {
    setCsrfToken(getCSRFToken());
  }, []);

  // Load saved data from localStorage if available
  useEffect(() => {
    const savedPersonalInfo = localStorage.getItem('checkout_personal_info');
    const savedAddress = localStorage.getItem('checkout_address');

    if (savedPersonalInfo) {
      try {
        setPersonalInfo(JSON.parse(savedPersonalInfo) as PersonalInfo);
      } catch (error) {
        console.error('Error loading saved personal info:', error);
      }
    }

    if (savedAddress) {
      try {
        setAddress(JSON.parse(savedAddress) as DeliveryAddress);
      } catch (error) {
        console.error('Error loading saved address:', error);
      }
    }
  }, []);

  const handlePersonalInfoChange = (field: keyof PersonalInfo, value: string) => {
    let sanitizedValue = value;

    // Apply field-specific sanitization
    switch (field) {
      case 'firstName':
      case 'lastName': {
        sanitizedValue = sanitizeText(value);
        break;
      }
      case 'email': {
        // Don't sanitize email during typing, only on validation
        sanitizedValue = value.toLowerCase().trim();
        break;
      }
      case 'phone': {
        sanitizedValue = sanitizePhone(value);
        // Format for display
        const formatted = sanitizedValue.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        sanitizedValue = formatted;
        break;
      }
      case 'dateOfBirth': {
        sanitizedValue = value; // Date inputs are inherently safe
        break;
      }
      default: {
        sanitizedValue = sanitizeText(value);
      }
    }

    setPersonalInfo((prev) => ({ ...prev, [field]: sanitizedValue }));
  };

  const handleAddressChange = (field: keyof DeliveryAddress, value: string) => {
    let sanitizedValue = value;

    // Apply field-specific sanitization
    switch (field) {
      case 'street':
      case 'apartment':
      case 'city': {
        sanitizedValue = sanitizeText(value);
        break;
      }
      case 'zipCode': {
        sanitizedValue = sanitizeZipCode(value);
        break;
      }
      case 'deliveryInstructions': {
        sanitizedValue = sanitizeText(value);
        break;
      }
      default: {
        sanitizedValue = sanitizeText(value);
      }
    }

    setAddress((prev) => ({ ...prev, [field]: sanitizedValue }));
    setIsValidAddress(null);
    setValidationError(null);
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateForm = (): string | null => {
    if (!personalInfo.firstName.trim()) return 'First name is required';
    if (!personalInfo.lastName.trim()) return 'Last name is required';
    if (!personalInfo.email.trim()) return 'Email is required';
    if (!personalInfo.phone.trim()) return 'Phone number is required';
    if (!personalInfo.dateOfBirth) return 'Date of birth is required';
    if (!address.street.trim()) return 'Street address is required';
    if (!address.city.trim()) return 'City is required';
    if (!address.zipCode.trim()) return 'ZIP code is required';

    const age = calculateAge(personalInfo.dateOfBirth);
    if (age < 21) return 'You must be 21 or older to place an order';

    const sanitizedEmail = sanitizeEmail(personalInfo.email);
    if (!sanitizedEmail) return 'Please enter a valid email address';

    const phoneRegex = /^\d{10}$/;
    const cleanPhone = personalInfo.phone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) return 'Please enter a valid 10-digit phone number';

    return null;
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
        if (
          address.city.toLowerCase() === 'minneapolis' ||
          address.city.toLowerCase() === 'st paul'
        ) {
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

  const handleContinue = () => {
    // Validate CSRF token
    if (!validateCSRFToken(csrfToken)) {
      setValidationError('Security token invalid. Please refresh the page.');
      return;
    }

    const formError = validateForm();
    if (formError) {
      setValidationError(formError);
      return;
    }

    if (!isValidAddress) {
      validateAddress();
      return;
    }

    const addressWithFees = {
      ...address,
      deliveryFee,
      estimatedTime,
    };

    // Save data to localStorage for checkout process
    localStorage.setItem('checkout_personal_info', JSON.stringify(personalInfo));
    localStorage.setItem('checkout_address', JSON.stringify(addressWithFees));
    localStorage.setItem('delivery_address', JSON.stringify(addressWithFees));

    // Navigate to payment step
    navigate('/checkout/payment');
  };

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

        {/* Personal Information Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hidden CSRF token */}
            <input type="hidden" name="csrf_token" value={csrfToken} />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={personalInfo.firstName}
                  onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
                  className={
                    validationError && !personalInfo.firstName.trim() ? 'border-destructive' : ''
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={personalInfo.lastName}
                  onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
                  className={
                    validationError && !personalInfo.lastName.trim() ? 'border-destructive' : ''
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={personalInfo.email}
                onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                className={
                  validationError && !personalInfo.email.trim() ? 'border-destructive' : ''
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={personalInfo.phone}
                onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                className={
                  validationError && !personalInfo.phone.trim() ? 'border-destructive' : ''
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth * (Must be 21+)</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={personalInfo.dateOfBirth}
                onChange={(e) => handlePersonalInfoChange('dateOfBirth', e.target.value)}
                max={
                  new Date(new Date().setFullYear(new Date().getFullYear() - 21))
                    .toISOString()
                    .split('T')[0]
                }
                className={validationError && !personalInfo.dateOfBirth ? 'border-destructive' : ''}
              />
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
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className={validationError && !address.street ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apartment">Apartment, Suite, etc.</Label>
              <Input
                id="apartment"
                placeholder="Apt 4B (optional)"
                value={address.apartment}
                onChange={(e) => handleAddressChange('apartment', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Minneapolis"
                  value={address.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
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
                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                className={validationError && !address.zipCode ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Delivery Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Ring doorbell, leave at door, etc."
                value={address.deliveryInstructions}
                onChange={(e) => handleAddressChange('deliveryInstructions', e.target.value)}
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
          <Button onClick={handleContinue} disabled={!isValidAddress} className="flex-1">
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
