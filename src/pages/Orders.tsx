import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import { SEOHead } from '@/components/SEOHead';
import { Package, ArrowLeft, Download, ChevronDown, ChevronUp } from '@/lib/icons';
import {
  useOrders,
  getOrderStatusInfo,
  formatOrderDate,
  formatOrderTime,
  type Order,
} from '@/hooks/useOrders';

export default function Orders() {
  const navigate = useNavigate();
  const { data: orders, isLoading } = useOrders();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleDownloadReceipt = (orderId: string, orderNumber: string) => {
    // Generate receipt content
    const order = orders?.find((o) => o.id === orderId);
    if (!order) return;

    const receiptContent = generateReceiptHTML(order);

    // Create blob and download
    const blob = new Blob([receiptContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DankDeals-Receipt-${orderNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateReceiptHTML = (order: Order) => {
    const items = order.order_items || [];

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${order.order_number}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #6DD400; padding-bottom: 20px; }
    .logo { color: #6DD400; font-size: 32px; font-weight: bold; }
    .order-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .section { margin: 20px 0; }
    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f9f9f9; font-weight: bold; }
    .totals { margin-top: 20px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .totals-row.total { font-size: 20px; font-weight: bold; border-top: 2px solid #6DD400; margin-top: 10px; padding-top: 15px; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🌿 DankDeals MN</div>
    <p style="margin: 5px 0;">Premium Cannabis Delivery</p>
    <p style="margin: 5px 0; color: #666;">Phone: 612-930-1390 | Email: support@dankdealsmn.com</p>
  </div>

  <div class="order-info">
    <h2 style="margin: 0 0 15px 0;">Order Receipt</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      <div>
        <strong>Order Number:</strong> ${order.order_number}<br>
        <strong>Order Date:</strong> ${formatOrderDate(order.created_at)}<br>
        <strong>Order Time:</strong> ${formatOrderTime(order.created_at)}
      </div>
      <div>
        <strong>Status:</strong> <span class="status" style="background: #${getOrderStatusInfo(order.status).color.includes('green') ? 'dcfce7' : 'fee2e2'};">${getOrderStatusInfo(order.status).label}</span><br>
        <strong>Payment:</strong> ${order.payment_method.toUpperCase()}<br>
        <strong>Payment Status:</strong> ${order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Delivery Information</div>
    <p><strong>Recipient:</strong> ${order.delivery_first_name} ${order.delivery_last_name}</p>
    <p><strong>Address:</strong><br>
      ${order.delivery_street_address}${order.delivery_apartment ? ', ' + order.delivery_apartment : ''}<br>
      ${order.delivery_city}, ${order.delivery_state} ${order.delivery_zip_code}
    </p>
    ${order.delivery_phone ? `<p><strong>Phone:</strong> ${order.delivery_phone}</p>` : ''}
    ${order.delivery_instructions ? `<p><strong>Instructions:</strong> ${order.delivery_instructions}</p>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Order Items</div>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (item) => `
          <tr>
            <td>
              <strong>${item.product_name}</strong>
              ${item.product_category ? `<br><span style="color: #666; font-size: 12px;">${item.product_category}</span>` : ''}
            </td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">${formatCurrency(Number(item.unit_price))}</td>
            <td style="text-align: right;">${formatCurrency(Number(item.total_price))}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(Number(order.subtotal))}</span>
    </div>
    <div class="totals-row">
      <span>Delivery Fee:</span>
      <span>${formatCurrency(Number(order.delivery_fee))}</span>
    </div>
    <div class="totals-row">
      <span>Tax (8.75%):</span>
      <span>${formatCurrency(Number(order.tax_amount))}</span>
    </div>
    <div class="totals-row total">
      <span>Total:</span>
      <span>${formatCurrency(Number(order.total_amount))}</span>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for choosing DankDeals MN!</p>
    <p>This receipt was generated on ${new Date().toLocaleString('en-US')}</p>
    <p style="margin-top: 20px;">Questions? Contact us at support@dankdealsmn.com or call 612-930-1390</p>
  </div>
</body>
</html>
    `.trim();
  };

  return (
    <>
      <SEOHead
        title="Order History - DankDeals MN"
        description="View your order history and track deliveries"
        url="https://dankdealsmn.com/orders"
      />

      <div className="min-h-screen bg-gradient-dark pb-32 md:pb-0">
        <DesktopHeader />
        <MobileHeader title="Order History" />

        <div className="max-w-4xl mx-auto px-4 pt-8 pb-24">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate('/profile')} className="mb-6 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Account
          </Button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Order History</h1>
            <p className="text-muted-foreground">
              View your past orders, track deliveries, and download receipts
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-24 w-full" />
                </Card>
              ))}
            </div>
          ) : !orders || orders.length === 0 ? (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-secondary mx-auto flex items-center justify-center">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">No orders yet</h2>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  When you place your first order, it will appear here.
                </p>
                <Button onClick={() => navigate('/')} className="btn-primary">
                  Start Shopping
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusInfo = getOrderStatusInfo(order.status);
                const isExpanded = expandedOrderId === order.id;
                const items = order.order_items || [];

                return (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                            <Badge className={statusInfo.color} variant="outline">
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                              Placed on {formatOrderDate(order.created_at)} at{' '}
                              {formatOrderTime(order.created_at)}
                            </p>
                            <p>
                              {items.length} item{items.length !== 1 ? 's' : ''} •{' '}
                              {formatCurrency(Number(order.total_amount))}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadReceipt(order.id, order.order_number);
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0">
                        <Separator className="mb-4" />

                        {/* Order Items */}
                        <div className="space-y-4 mb-6">
                          <h3 className="font-semibold">Items Ordered</h3>
                          <div className="space-y-3">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30"
                              >
                                <div className="flex-1">
                                  <p className="font-medium">{item.product_name}</p>
                                  {item.product_category && (
                                    <p className="text-xs text-muted-foreground capitalize">
                                      {item.product_category}
                                    </p>
                                  )}
                                  {item.product_weight_grams && (
                                    <p className="text-xs text-muted-foreground">
                                      {item.product_weight_grams}g
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">
                                    {formatCurrency(Number(item.total_price))}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.quantity} × {formatCurrency(Number(item.unit_price))}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Totals */}
                        <div className="space-y-2 mb-6">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{formatCurrency(Number(order.subtotal))}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Delivery Fee</span>
                            <span>{formatCurrency(Number(order.delivery_fee))}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tax</span>
                            <span>{formatCurrency(Number(order.tax_amount))}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-semibold text-lg">
                            <span>Total</span>
                            <span>{formatCurrency(Number(order.total_amount))}</span>
                          </div>
                        </div>

                        {/* Delivery Information */}
                        <div className="space-y-2">
                          <h3 className="font-semibold">Delivery Details</h3>
                          <div className="text-sm space-y-1">
                            <p>
                              <strong>Recipient:</strong> {order.delivery_first_name}{' '}
                              {order.delivery_last_name}
                            </p>
                            <p>
                              <strong>Address:</strong> {order.delivery_street_address}
                              {order.delivery_apartment && `, ${order.delivery_apartment}`}
                            </p>
                            <p>
                              {order.delivery_city}, {order.delivery_state}{' '}
                              {order.delivery_zip_code}
                            </p>
                            {order.delivery_phone && (
                              <p>
                                <strong>Phone:</strong> {order.delivery_phone}
                              </p>
                            )}
                            {order.delivery_instructions && (
                              <p>
                                <strong>Instructions:</strong> {order.delivery_instructions}
                              </p>
                            )}
                            {order.estimated_delivery_at && (
                              <p>
                                <strong>Estimated Delivery:</strong>{' '}
                                {formatOrderDate(order.estimated_delivery_at)} at{' '}
                                {formatOrderTime(order.estimated_delivery_at)}
                              </p>
                            )}
                            {order.delivered_at && (
                              <p className="text-green-600">
                                <strong>Delivered:</strong> {formatOrderDate(order.delivered_at)} at{' '}
                                {formatOrderTime(order.delivered_at)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Payment Information */}
                        <div className="mt-4 pt-4 border-t space-y-2">
                          <h3 className="font-semibold">Payment Information</h3>
                          <div className="text-sm space-y-1">
                            <p>
                              <strong>Method:</strong>{' '}
                              {order.payment_method === 'cash'
                                ? 'Cash on Delivery'
                                : order.payment_method === 'card'
                                  ? 'Credit/Debit Card'
                                  : 'Other'}
                            </p>
                            <p>
                              <strong>Status:</strong>{' '}
                              <span
                                className={
                                  order.payment_status === 'paid'
                                    ? 'text-green-600 font-semibold'
                                    : order.payment_status === 'failed'
                                      ? 'text-red-600 font-semibold'
                                      : 'text-yellow-600 font-semibold'
                                }
                              >
                                {order.payment_status.charAt(0).toUpperCase() +
                                  order.payment_status.slice(1)}
                              </span>
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </>
  );
}
