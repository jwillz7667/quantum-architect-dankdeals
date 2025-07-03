import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
type ProductVariantRow = Database['public']['Tables']['product_variants']['Row'];
type ProductRow = Database['public']['Tables']['products']['Row'];

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface CategoryData {
  category: string;
  revenue: number;
  quantity: number;
}

interface ProductData {
  product_id: string;
  product_name: string;
  total_revenue: number;
  total_quantity: number;
  order_count: number;
}

interface UserGrowthData {
  date: string;
  newUsers: number;
}

interface Metrics {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  avgOrderValue: number;
  totalUsers: number;
  activeUsers: number;
  conversionRate: number;
}

interface OrderItemWithRelations extends OrderItemRow {
  product_variants: {
    products: Pick<ProductRow, 'category'> | null;
  } | null;
}

interface OrderWithItems extends OrderRow {
  order_items: OrderItemWithRelations[] | null;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState('30');
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [productData, setProductData] = useState<ProductData[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalRevenue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalUsers: 0,
    activeUsers: 0,
    conversionRate: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(timeRange));

      // Fetch revenue data
      const revenuePromises = [];
      const tempRevenueData: RevenueData[] = [];
      
      for (let i = parseInt(timeRange) - 1; i >= 0; i--) {
        const date = startOfDay(subDays(new Date(), i));
        const nextDate = startOfDay(subDays(new Date(), i - 1));
        
        revenuePromises.push(
          supabase
            .from('orders')
            .select('total_amount, created_at')
            .gte('created_at', date.toISOString())
            .lt('created_at', nextDate.toISOString())
            .neq('status', 'cancelled')
            .then(({ data, error }) => {
              if (!error && data) {
                const dayRevenue = data.reduce((sum, order) => sum + (order.total_amount || 0), 0);
                tempRevenueData.push({
                  date: format(date, 'MMM dd'),
                  revenue: dayRevenue / 100,
                  orders: data.length,
                });
              }
            })
        );
      }

      await Promise.all(revenuePromises);
      setRevenueData(tempRevenueData.sort((a, b) => a.date.localeCompare(b.date)));

      // Fetch category performance
      const { data: categoryPerformance } = await supabase
        .from('orders')
        .select(`
          order_items (
            total_price,
            quantity,
            product_variants (
              products (
                category
              )
            )
          )
        `)
        .gte('created_at', startDate.toISOString())
        .neq('status', 'cancelled');

      if (categoryPerformance) {
        const categoryTotals: Record<string, { revenue: number; quantity: number }> = {};
        
        (categoryPerformance as unknown as OrderWithItems[]).forEach(order => {
          order.order_items?.forEach((item) => {
            const category = item.product_variants?.products?.category || 'other';
            if (!categoryTotals[category]) {
              categoryTotals[category] = { revenue: 0, quantity: 0 };
            }
            categoryTotals[category].revenue += item.total_price;
            categoryTotals[category].quantity += item.quantity;
          });
        });

        const formattedCategoryData = Object.entries(categoryTotals).map(([category, data]) => ({
          category: category.charAt(0).toUpperCase() + category.slice(1),
          revenue: data.revenue / 100,
          quantity: data.quantity,
        }));

        setCategoryData(formattedCategoryData);
      }

      // Fetch product performance
      const { data: productPerformance } = await supabase
        .rpc('get_product_performance', {
          date_from: startDate.toISOString(),
          date_to: endDate.toISOString()
        });

      if (productPerformance) {
        setProductData((productPerformance as ProductData[]).slice(0, 10).map((p) => ({
          ...p,
          total_revenue: p.total_revenue / 100
        })));
      }

      // Fetch user growth data
      const userGrowthPromises = [];
      const tempUserGrowthData: UserGrowthData[] = [];
      
      for (let i = parseInt(timeRange) - 1; i >= 0; i--) {
        const date = startOfDay(subDays(new Date(), i));
        const nextDate = startOfDay(subDays(new Date(), i - 1));
        
        userGrowthPromises.push(
          supabase
            .from('profiles')
            .select('created_at')
            .gte('created_at', date.toISOString())
            .lt('created_at', nextDate.toISOString())
            .then(({ data, error }) => {
              if (!error) {
                tempUserGrowthData.push({
                  date: format(date, 'MMM dd'),
                  newUsers: data?.length || 0,
                });
              }
            })
        );
      }

      await Promise.all(userGrowthPromises);
      setUserGrowthData(tempUserGrowthData.sort((a, b) => a.date.localeCompare(b.date)));

      // Calculate metrics
      const { data: currentPeriodOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', startDate.toISOString())
        .neq('status', 'cancelled');

      const { data: previousPeriodOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', subDays(startDate, parseInt(timeRange)).toISOString())
        .lt('created_at', startDate.toISOString())
        .neq('status', 'cancelled');

      const currentRevenue = currentPeriodOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const previousRevenue = previousPeriodOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { data: activeUsers } = await supabase
        .from('orders')
        .select('customer_id')
        .gte('created_at', startDate.toISOString());

      const uniqueActiveUsers = new Set(activeUsers?.map(o => o.customer_id)).size;

      setMetrics({
        totalRevenue: currentRevenue / 100,
        revenueGrowth,
        totalOrders: currentPeriodOrders?.length || 0,
        avgOrderValue: currentPeriodOrders?.length ? currentRevenue / currentPeriodOrders.length / 100 : 0,
        totalUsers: totalUsers || 0,
        activeUsers: uniqueActiveUsers,
        conversionRate: totalUsers ? (uniqueActiveUsers / totalUsers) * 100 : 0,
      });

    } catch (error) {
      console.error('Analytics error:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            {getGrowthIcon(metrics.revenueGrowth)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.revenueGrowth > 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}% from previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Avg value: {formatCurrency(metrics.avgOrderValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.conversionRate.toFixed(1)}% of total users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="users">User Growth</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Daily revenue over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Revenue by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best performing products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productData.map((product, index) => (
                  <div key={product.product_id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-sm font-medium text-green-700">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.total_quantity} units sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(product.total_revenue)}</p>
                      <p className="text-sm text-muted-foreground">{product.order_count} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>New user registrations over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="newUsers" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 