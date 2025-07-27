import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  Calendar,
  DollarSign,
  ChevronRight,
  RefreshCw,
} from '@/lib/icons';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  product_weight_grams: number;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled'
    | 'refunded';
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  total_amount: number;
  delivery_first_name: string;
  delivery_last_name: string;
  delivery_street_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_zip_code: string;
  payment_method: string;
  payment_status: string;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  processing: {
    label: 'Processing',
    icon: Package,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    icon: Truck,
    color: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'bg-green-50 text-green-700 border-green-200',
  },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-red-50 text-red-700 border-red-200' },
  refunded: {
    label: 'Refunded',
    icon: RefreshCw,
    color: 'bg-gray-50 text-gray-700 border-gray-200',
  },
};

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (*)
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading orders',
        description: 'Unable to load your order history. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      void fetchOrders();
    }
  }, [user, fetchOrders]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_items.some((item) =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getOrderStatusBadge = (status: Order['status']) => {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Order History</span>
          </CardTitle>
          <CardDescription>View and track all your orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-4">
              {orders.length === 0
                ? "You haven't placed any orders yet."
                : 'No orders match your current filters.'}
            </p>
            <Button onClick={() => (window.location.href = '/categories')}>Start Shopping</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleOrderExpansion(order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-semibold">#{order.order_number}</h3>
                        {getOrderStatusBadge(order.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(order.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatPrice(order.total_amount)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4" />
                          <span>
                            {order.order_items.length} item
                            {order.order_items.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      className={`h-5 w-5 text-muted-foreground transition-transform ${
                        expandedOrder === order.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="border-t bg-muted/30 p-6 space-y-4">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-semibold mb-3">Order Items</h4>
                      <div className="space-y-2">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-3 bg-background rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{item.product_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.product_weight_grams}g • Qty: {item.quantity}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatPrice(item.total_price)}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatPrice(item.unit_price)} each
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Delivery Address</h4>
                        <div className="text-sm space-y-1">
                          <div>
                            {order.delivery_first_name} {order.delivery_last_name}
                          </div>
                          <div>{order.delivery_street_address}</div>
                          <div>
                            {order.delivery_city}, {order.delivery_state} {order.delivery_zip_code}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Order Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatPrice(order.subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax:</span>
                            <span>{formatPrice(order.tax_amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Delivery:</span>
                            <span>{formatPrice(order.delivery_fee)}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t pt-2">
                            <span>Total:</span>
                            <span>{formatPrice(order.total_amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="flex space-x-2 pt-4">
                      {order.status === 'delivered' && (
                        <Button variant="outline" size="sm">
                          Reorder
                        </Button>
                      )}
                      {['pending', 'confirmed'].includes(order.status) && (
                        <Button variant="outline" size="sm">
                          Cancel Order
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Contact Support
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
