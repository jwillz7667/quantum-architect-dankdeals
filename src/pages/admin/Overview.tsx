import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../hooks/use-toast';
import { z } from 'zod';

const dashboardSchema = z.object({
  totalOrders: z.number(),
  totalRevenue: z.number(),
  totalProducts: z.number(),
});

const fetchDashboardData = async () => {
  const { data: ordersData, error: ordersError } = await supabase.from('orders').select('total_amount');
  if (ordersError) throw ordersError;

  const { count: productsCount, error: productsError } = await supabase.from('products').select('id', { count: 'exact', head: true });
  if (productsError) throw productsError;

  const totalOrders = (ordersData as Array<{ total_amount: number }> || [])?.length || 0;
  const totalRevenue = (ordersData as Array<{ total_amount: number }> || [])?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
  const totalProducts = productsCount || 0;

  return dashboardSchema.parse({ totalOrders, totalRevenue, totalProducts });
};

const Overview: React.FC = () => {
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminOverview'],
    queryFn: fetchDashboardData,
  });

  if (error) {
    toast({ variant: 'destructive', title: 'Error loading overview' });
  }

  return (
    <div>
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Total Orders</CardTitle></CardHeader>
            <CardContent><p className="text-3xl">{data?.totalOrders}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader>
            <CardContent><p className="text-3xl">${data?.totalRevenue.toFixed(2)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Total Products</CardTitle></CardHeader>
            <CardContent><p className="text-3xl">{data?.totalProducts}</p></CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Overview; 