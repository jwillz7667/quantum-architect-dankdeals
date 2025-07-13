import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/use-toast';
import { z } from 'zod';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const analyticsSchema = z.object({
  dailySales: z.array(z.object({
    date: z.string(),
    revenue: z.number(),
    orders: z.number(),
  })),
  topProducts: z.array(z.object({
    name: z.string(),
    sales: z.number(),
  })),
  monthlyRevenue: z.number(),
  monthlyOrders: z.number(),
  averageOrderValue: z.number(),
});

const fetchAnalytics = async () => {
  // Fetch orders from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('created_at, total_amount, order_items(quantity, product:products(name, price))')
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (ordersError) throw ordersError;

  // Process daily sales
  const dailySalesMap = new Map<string, { revenue: number; orders: number }>();
  
  type OrderType = {
    created_at: string;
    total_amount: number;
    order_items?: Array<{
      quantity: number;
      product?: { name: string };
    }>;
  };
  
  (orders as OrderType[] || []).forEach((order) => {
    const date = new Date(order.created_at).toLocaleDateString();
    const existing = dailySalesMap.get(date) || { revenue: 0, orders: 0 };
    dailySalesMap.set(date, {
      revenue: existing.revenue + order.total_amount,
      orders: existing.orders + 1,
    });
  });

  const dailySales = Array.from(dailySalesMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Process top products
  const productSalesMap = new Map<string, number>();
  
  (orders as OrderType[] || []).forEach((order) => {
    order.order_items?.forEach((item) => {
      const productName = item.product?.name || 'Unknown';
      const existing = productSalesMap.get(productName) || 0;
      productSalesMap.set(productName, existing + item.quantity);
    });
  });

  const topProducts = Array.from(productSalesMap.entries())
    .map(([name, sales]) => ({ name, sales }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // Calculate monthly stats
  const monthlyRevenue = (orders as OrderType[] || []).reduce((sum: number, order) => sum + order.total_amount, 0) || 0;
  const monthlyOrders = (orders as OrderType[] || [])?.length || 0;
  const averageOrderValue = monthlyOrders > 0 ? monthlyRevenue / monthlyOrders : 0;

  return analyticsSchema.parse({
    dailySales,
    topProducts,
    monthlyRevenue,
    monthlyOrders,
    averageOrderValue,
  });
};

const Analytics: React.FC = () => {
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: fetchAnalytics,
  });

  if (error) {
    toast({ variant: 'destructive', title: 'Error loading analytics' });
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      
      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${data?.monthlyRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Monthly Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{data?.monthlyOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${data?.averageOrderValue.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Analytics; 