import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import { CheckCircle, Clock, Home, Phone } from 'lucide-react';

export default function CheckoutComplete() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order');

  useEffect(() => {
    // If no order number, redirect to home
    if (!orderNumber) {
      navigate('/');
    }
  }, [orderNumber, navigate]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <DesktopHeader />
      <MobileHeader title="Order Complete" />

      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Success Message */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your order. We've received your request and will contact you shortly.
          </p>
        </div>

        {/* Order Number */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Order Number</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-2xl font-bold text-primary">{orderNumber}</p>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              What Happens Next?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium">Order Review</p>
                <p className="text-sm text-muted-foreground">
                  We'll verify your order details and age verification.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium">Confirmation Call</p>
                <p className="text-sm text-muted-foreground">
                  We'll call you to confirm your order and delivery details.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium">Delivery</p>
                <p className="text-sm text-muted-foreground">
                  Your order will be delivered within the estimated timeframe.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Alert>
          <Phone className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-1">Questions about your order?</p>
            <p className="text-sm">
              Call us at{' '}
              <a href="tel:763-247-5378" className="text-primary font-medium hover:underline">
                763-247-5378
              </a>
            </p>
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button onClick={() => navigate('/')} className="w-full" size="lg">
            <Home className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </div>

        {/* Important Notes */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">Important Reminders:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• You must be 21+ with valid ID for delivery</li>
              <li>• Payment is cash only upon delivery</li>
              <li>• Please have exact change ready</li>
              <li>• Delivery is available in Minneapolis area only</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
