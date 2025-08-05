import { Card, CardContent, CardHeader } from '@mui/material';
import { Title } from 'react-admin';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Package, ShoppingCart, Users, DollarSign } from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
}

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    void loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get product count
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Get order count and revenue
      const { data: orders } = await supabase.from('orders').select('total');

      const orderCount = orders?.length || 0;
      const revenue =
        orders?.reduce((sum: number, order: { total?: number }) => sum + (order.total || 0), 0) ||
        0;

      // Get user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalProducts: productCount || 0,
        totalOrders: orderCount,
        totalUsers: userCount || 0,
        totalRevenue: revenue,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: '#3b82f6',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: '#10b981',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: '#8b5cf6',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: '#f59e0b',
    },
  ];

  return (
    <>
      <Title title="Dashboard" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader
                title={stat.title}
                avatar={<Icon size={24} style={{ color: stat.color }} />}
              />
              <CardContent>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stat.color }}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card style={{ marginTop: '2rem' }}>
        <CardHeader title="Recent Activity" />
        <CardContent>
          <p>View recent orders, product updates, and user activity here.</p>
        </CardContent>
      </Card>
    </>
  );
};
