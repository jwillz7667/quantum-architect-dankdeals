import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MobileHeader } from "@/components/MobileHeader";
import { DesktopHeader } from "@/components/DesktopHeader";
import { BottomNav } from "@/components/BottomNav";
import { CheckCircle, Clock, MapPin, ArrowRight, Home } from "lucide-react";

export default function CheckoutComplete() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderNumber = searchParams.get('order');
  
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>('');

  useEffect(() => {
    // Calculate estimated delivery time (45 minutes from now)
    const now = new Date();
    const deliveryTime = new Date(now.getTime() + 45 * 60000);
    setEstimatedDelivery(deliveryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  if (!orderNumber) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <DesktopHeader />
      <MobileHeader title="Order Confirmed" />

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Success Message */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Your cannabis order has been placed successfully
            </p>
          </div>
        </div>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
              <div>
                <p className="font-semibold text-primary">Order Number</p>
                <p className="text-lg font-mono">{orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium text-primary">Confirmed</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Estimated Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    Today around {estimatedDelivery}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Delivery Method</p>
                  <p className="text-sm text-muted-foreground">
                    Cash on delivery to your address
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card>
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Order Processing</p>
                <p className="text-sm text-muted-foreground">
                  Your order is being prepared by our licensed dispensary
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Driver Assignment</p>
                <p className="text-sm text-muted-foreground">
                  A licensed delivery driver will be assigned to your order
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Delivery</p>
                <p className="text-sm text-muted-foreground">
                  Your driver will contact you when they're on the way
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Reminders */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Important Reminders:</p>
              <ul className="text-sm space-y-1">
                <li>• Have your valid ID ready for age verification</li>
                <li>• Have exact change ready if paying with cash</li>
                <li>• Be available at your delivery address</li>
                <li>• Orders are for recipients 21+ years old only</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/profile/orders')}
            className="w-full"
            variant="outline"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Track Your Order
          </Button>
          
          <Button 
            onClick={() => navigate('/')}
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </div>

        {/* Support Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Need help with your order?</p>
          <p>Contact us at <a href="mailto:support@dankdealsmn.com" className="text-primary underline">support@dankdealsmn.com</a></p>
          <p>or call <a href="tel:+16125551234" className="text-primary underline">(612) 555-1234</a></p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
} 