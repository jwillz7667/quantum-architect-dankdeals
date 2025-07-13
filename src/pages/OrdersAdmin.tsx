import React, { useState } from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { supabase } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { useToast } from '../hooks/use-toast';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Eye } from 'lucide-react';

const orderSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  total_amount: z.number(),
  status: z.string(),
  created_at: z.string(),
  email: z.string().optional(),
  order_items: z
    .array(
      z.object({
        quantity: z.number(),
        price: z.number(),
        product: z
          .object({
            name: z.string(),
          })
          .optional(),
      })
    )
    .optional(),
});

type Order = z.infer<typeof orderSchema>;

const fetchOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items(
        quantity,
        price,
        product:products(name)
      )
    `
    )
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch user emails separately using auth admin API if needed
  // For now, we'll just use the user_id as orders table has that
  type OrderWithItems = {
    id: string;
    user_id: string;
    total_amount: number;
    status: string;
    created_at: string;
    order_items?: Array<{
      quantity: number;
      price: number;
      product?: { name: string };
    }>;
  };

  const orders = ((data || []) as OrderWithItems[]).map((order) => ({
    ...order,
    email: order.user_id, // For now, show user_id instead of email
  }));

  return z.array(orderSchema).parse(orders);
};

const updateOrderStatus = async ({ id, status }: { id: string; status: string }) => {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);

  if (error) throw error;
};

const OrdersAdmin: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const {
    data: orders,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ordersAdmin'],
    queryFn: fetchOrders,
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ordersAdmin'] });
      toast({ title: 'Order status updated' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Error updating order' }),
  });

  if (error) {
    toast({ variant: 'destructive', title: 'Error loading orders' });
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      processing: 'default',
      completed: 'outline',
      cancelled: 'destructive',
    };

    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  return (
    <ProtectedRoute requiresAdmin>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Manage Orders</h1>
        {isLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}...</TableCell>
                  <TableCell>{order.email || 'N/A'}</TableCell>
                  <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Order Details</DialogTitle>
                        </DialogHeader>
                        {selectedOrder && (
                          <div className="space-y-4">
                            <div>
                              <p>
                                <strong>Order ID:</strong> {selectedOrder.id}
                              </p>
                              <p>
                                <strong>Customer:</strong> {selectedOrder.email}
                              </p>
                              <p>
                                <strong>Date:</strong>{' '}
                                {new Date(selectedOrder.created_at).toLocaleString()}
                              </p>
                              <p>
                                <strong>Status:</strong> {getStatusBadge(selectedOrder.status)}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Order Items</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedOrder.order_items?.map((item, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{item.product?.name || 'Unknown'}</TableCell>
                                      <TableCell>{item.quantity}</TableCell>
                                      <TableCell>${item.price.toFixed(2)}</TableCell>
                                      <TableCell>
                                        ${(item.quantity * item.price).toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold">
                                Total: ${selectedOrder.total_amount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default OrdersAdmin;
