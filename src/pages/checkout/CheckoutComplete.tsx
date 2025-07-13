import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  ArrowRight, 
  Home, 
  User, 
  Calendar,
  Phone,
  Package,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  product_weight_grams: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  products?: {
    category?: string;
    strain_type?: string;
    thc_content?: string;
    cbd_content?: string;
  };
}

interface OrderDetails {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  delivery_first_name?: string;
  delivery_last_name?: string;
  delivery_street_address?: string;
  delivery_apartment?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_zip_code?: string;
  delivery_phone?: string;
  delivery_instructions?: string;
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  total_amount: number;
  order_items: OrderItem[];
  profiles?: {
    email?: string;
    date_of_birth?: string;
  };
}

export default function CheckoutComplete() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const orderNumber = searchParams.get('order');

  const [estimatedDelivery, setEstimatedDelivery] = useState<string>('');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Calculate estimated delivery time (45 minutes from now)
    const now = new Date();
    const deliveryTime = new Date(now.getTime() + 45 * 60000);
    setEstimatedDelivery(
      deliveryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  }, []);

  // Load order details
  useEffect(() => {
    const loadOrderDetails = async () => {
      if (!orderNumber || !user) return;

      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (
                category,
                strain_type,
                thc_content,
                cbd_content
              )
            ),
            profiles!user_id (
              email,
              date_of_birth
            )
          `)
          .eq('order_number', orderNumber)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error loading order:', error);
          navigate('/cart');
          return;
        }

        setOrder(data as OrderDetails);
      } catch (error) {
        console.error('Error loading order:', error);
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };

    void loadOrderDetails();
  }, [orderNumber, user, navigate]);

  const formatDateOfBirth = (dob?: string) => {
    if (!dob) return 'Not provided';
    const date = new Date(dob);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (!orderNumber) {
    navigate('/cart');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <DesktopHeader />
        <MobileHeader title="Order Confirmed" />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <DesktopHeader />
        <MobileHeader title="Order Not Found" />
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground mb-4">Order not found</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <DesktopHeader />
      <MobileHeader title="Order Confirmed" />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Success Message */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Thank You For Your Order!</h1>
            <p className="text-muted-foreground mb-2">
              Your cannabis order has been placed successfully
            </p>
            <Alert className="max-w-md mx-auto border-primary bg-primary/5">
              <Phone className="h-4 w-4" />
              <AlertDescription className="text-primary font-medium">
                A DankDeals team member will call you within 5 minutes to confirm your order details and provide your delivery time.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
              <div>
                <p className="font-semibold text-primary">Order Number</p>
                <p className="text-lg font-mono">{order.order_number}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="default" className="bg-primary">
                  {order.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Products Ordered:</h4>
              {order.order_items.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 rounded-lg border border-border">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{item.product_name}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      {item.products?.category && (
                        <Badge variant="secondary" className="text-xs">
                          {item.products.category}
                        </Badge>
                      )}
                      {item.products?.strain_type && (
                        <span className="text-xs text-muted-foreground">
                          {item.products.strain_type}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {item.product_weight_grams}g
                      </span>
                    </div>
                    {(item.products?.thc_content || item.products?.cbd_content) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.products.thc_content && `THC: ${item.products.thc_content}%`}
                        {item.products.thc_content && item.products.cbd_content && ' • '}
                        {item.products.cbd_content && `CBD: ${item.products.cbd_content}%`}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × ${item.unit_price.toFixed(2)}
                    </p>
                    <p className="font-medium">${item.total_price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${order.tax_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>${order.delivery_fee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary">${order.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Payment Method: Cash on Delivery
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Delivery Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Delivery Address</p>
              <p className="font-medium">
                {order.delivery_street_address} {order.delivery_apartment}
              </p>
              <p className="font-medium">
                {order.delivery_city}, {order.delivery_state} {order.delivery_zip_code}
              </p>
              {order.delivery_instructions && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  Special Instructions: "{order.delivery_instructions}"
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm">
                  Est. delivery: Today around {estimatedDelivery}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Verification Info */}
        <Card className="border-primary">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2 text-primary">
              <User className="w-5 h-5" />
              Customer Verification (Required at Delivery)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Alert className="border-warning bg-warning/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This information will be verified by your delivery driver. Please have your valid ID ready.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Customer Name</p>
                <p className="font-medium">
                  {order.delivery_first_name} {order.delivery_last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Phone Number</p>
                <p className="font-medium">{order.delivery_phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{order.profiles?.email || user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Date of Birth (21+ Verification)
                </p>
                <p className="font-medium">
                  {formatDateOfBirth(order.profiles?.date_of_birth)}
                </p>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium mb-1">Delivery Address (for verification)</p>
              <p className="text-sm">
                {order.delivery_street_address} {order.delivery_apartment}
                <br />
                {order.delivery_city}, {order.delivery_state} {order.delivery_zip_code}
              </p>
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
                <p className="font-medium">Order Confirmation Call</p>
                <p className="text-sm text-muted-foreground">
                  A DankDeals team member will call you within 5 minutes to confirm your order details and provide your exact delivery time
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Order Processing</p>
                <p className="text-sm text-muted-foreground">
                  Your order will be carefully prepared by our licensed dispensary
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium">
                3
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
                4
              </div>
              <div>
                <p className="font-medium">Delivery & Verification</p>
                <p className="text-sm text-muted-foreground">
                  Your driver will verify your ID and deliver your order
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
                <li>• Please answer your phone - we'll call within 5 minutes to confirm</li>
                <li>• Have your valid ID ready showing you are 21+ years old</li>
                <li>• Have exact cash ready (${order.total_amount.toFixed(2)})</li>
                <li>• Be available at your delivery address</li>
                <li>• Orders are for recipients 21+ years old only</li>
                <li>• Cannabis products cannot be returned once delivered</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button onClick={() => navigate('/profile/orders')} className="w-full" variant="outline">
            <ArrowRight className="w-4 h-4 mr-2" />
            Track Your Order
          </Button>

          <Button onClick={() => navigate('/')} className="w-full">
            <Home className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </div>

        {/* Support Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Need help with your order?</p>
          <p className="mt-2">
            Call or text us at{' '}
            <a href="tel:763-247-5378" className="text-primary font-semibold text-base">
              763-247-5378
            </a>
          </p>
          <p className="mt-1">
            or email{' '}
            <a href="mailto:support@dankdealsmn.com" className="text-primary underline">
              support@dankdealsmn.com
            </a>
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
