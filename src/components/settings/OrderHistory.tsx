/**
 * Order History Component
 *
 * Displays user's past orders with:
 * - Order status
 * - Order details
 * - Delivery information
 * - Order items
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Package,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { useOrders, getOrderStatusInfo, formatOrderDate, formatOrderTime } from '@/hooks/useOrders';
import { cn } from '@/lib/utils';

export default function OrderHistory() {
  const { data: orders = [], isLoading } = useOrders();
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No orders yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Your order history will appear here once you place your first order
        </p>
        <Button onClick={() => (window.location.href = '/products')}>Start Shopping</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Order History</h2>
        <p className="text-sm text-muted-foreground">View and track all your past orders</p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedOrders.has(order.id);
          const statusInfo = getOrderStatusInfo(order.status);

          return (
            <div key={order.id} className="rounded-lg border">
              {/* Order Header */}
              <div
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(order.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">Order #{order.order_number}</p>
                      <Badge variant="outline" className={cn('text-xs', statusInfo.color)}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatOrderDate(order.created_at)} at {formatOrderTime(order.created_at)}
                    </p>
                    <p className="text-sm font-medium">
                      ${parseFloat(order.total_amount.toString()).toFixed(2)}
                    </p>
                  </div>

                  <Button variant="ghost" size="sm">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Order Details (Expanded) */}
              {isExpanded && (
                <div className="border-t">
                  <div className="p-4 space-y-4">
                    {/* Order Items */}
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Items ({order.order_items?.length || 0})
                      </h4>
                      <div className="space-y-2">
                        {order.order_items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.product_name}</p>
                              {item.product_weight_grams && (
                                <p className="text-xs text-muted-foreground">
                                  {item.product_weight_grams}g
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm">
                                ${parseFloat(item.unit_price.toString()).toFixed(2)} ×{' '}
                                {item.quantity}
                              </p>
                              <p className="text-sm font-medium">
                                ${parseFloat(item.total_price.toString()).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Price Breakdown */}
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Price Breakdown
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>${parseFloat(order.subtotal.toString()).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tax</span>
                          <span>${parseFloat(order.tax_amount.toString()).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Delivery Fee</span>
                          <span>${parseFloat(order.delivery_fee.toString()).toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium text-base">
                          <span>Total</span>
                          <span>${parseFloat(order.total_amount.toString()).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Delivery Information */}
                    <div>
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Delivery Address
                      </h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">
                          {order.delivery_first_name} {order.delivery_last_name}
                        </p>
                        <p>
                          {order.delivery_street_address}
                          {order.delivery_apartment && `, ${order.delivery_apartment}`}
                        </p>
                        <p>
                          {order.delivery_city}, {order.delivery_state} {order.delivery_zip_code}
                        </p>
                        {order.delivery_phone && <p>Phone: {formatPhone(order.delivery_phone)}</p>}
                        {order.delivery_instructions && (
                          <p className="italic mt-2">"{order.delivery_instructions}"</p>
                        )}
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Payment Method</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {order.payment_method}
                        {' • '}
                        <span className="capitalize">{order.payment_status}</span>
                      </p>
                    </div>

                    {/* Delivery Timeline */}
                    {(order.estimated_delivery_at || order.delivered_at) && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Delivery Timeline
                        </h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>Ordered: {formatOrderDate(order.created_at)}</p>
                          {order.estimated_delivery_at && (
                            <p>
                              Estimated Delivery: {formatOrderDate(order.estimated_delivery_at)}
                            </p>
                          )}
                          {order.delivered_at && (
                            <p className="text-green-600 font-medium">
                              Delivered: {formatOrderDate(order.delivered_at)} at{' '}
                              {formatOrderTime(order.delivered_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Format phone number for display
 */
function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
}
