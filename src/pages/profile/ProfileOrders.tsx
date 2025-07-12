import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useRealTime } from '@/context/RealTimeContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { ArrowLeft, Package, Clock, CheckCircle, WifiOff, Wifi } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  payment_status: string;
  total_amount: number;
  user_id: string;
  // Delivery address fields (denormalized in database)
  delivery_first_name: string;
  delivery_last_name: string;
  delivery_street_address: string;
  delivery_apartment?: string;
  delivery_city: string;
  delivery_state: string;
  delivery_zip_code: string;
  delivery_phone?: string;
  delivery_instructions?: string;
}

export default function ProfileOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscribeToOrders, connectionStatus } = useRealTime();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        logger.error('Error fetching orders', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };

    void fetchOrders();
  }, [user]);

  // Subscribe to real-time order updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToOrders((payload) => {
      logger.info('Order update received in ProfileOrders', { 
        eventType: payload.eventType,
        orderId: (payload.new as Order | undefined)?.id || (payload.old as Order | undefined)?.id
      });

      if (payload.eventType === 'INSERT' && payload.new) {
        // Add new order to the beginning of the list
        setOrders((prev) => [payload.new as Order, ...prev]);
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        // Update existing order
        setOrders((prev) =>
          prev.map((order) =>
            order.id === payload.new.id ? (payload.new as Order) : order
          )
        );
      } else if (payload.eventType === 'DELETE' && payload.old) {
        // Remove deleted order
        setOrders((prev) => prev.filter((order) => order.id !== payload.old.id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, subscribeToOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
      case 'preparing':
        return <Clock className="w-4 h-4" />;
      case 'out_for_delivery':
        return <Package className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <DesktopHeader />
      <MobileHeader title="Order History" />

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Order History</h1>
          </div>
          {connectionStatus === 'connected' && (
            <div className="flex items-center gap-1 text-green-600">
              <Wifi className="w-4 h-4" />
              <span className="text-xs">Live</span>
            </div>
          )}
          {connectionStatus === 'error' && (
            <div className="flex items-center gap-1 text-red-600">
              <WifiOff className="w-4 h-4" />
              <span className="text-xs">Offline</span>
            </div>
          )}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
            <Button onClick={() => navigate('/')}>Start Shopping</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {order.status.replace('_', ' ')}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-semibold">${order.total_amount.toFixed(2)}</span>
                    </div>

                    {order.delivery_street_address && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Delivery Address:</p>
                        <p className="text-sm">
                          {order.delivery_street_address} {order.delivery_apartment}
                        </p>
                        <p className="text-sm">
                          {order.delivery_city}, {order.delivery_state} {order.delivery_zip_code}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                      {order.status === 'delivered' && (
                        <Button size="sm" className="flex-1">
                          Reorder
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
