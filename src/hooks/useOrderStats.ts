import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface OrderStats {
  totalOrders: number;
  activeOrders: number;
  deliveredOrders: number;
  totalSpent: number;
  loading: boolean;
  error: string | null;
}

export function useOrderStats(): OrderStats {
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    activeOrders: 0,
    deliveredOrders: 0,
    totalSpent: 0,
    loading: true,
    error: null,
  });

  const { user } = useAuth();

  useEffect(() => {
    const fetchOrderStats = async () => {
      if (!user) {
        setStats((prev) => ({ ...prev, loading: false }));
        return;
      }

      try {
        setStats((prev) => ({ ...prev, loading: true, error: null }));

        // Fetch all orders for the user
        const { data: orders, error } = await supabase
          .from('orders')
          .select('status, total_amount')
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        if (!orders) {
          setStats({
            totalOrders: 0,
            activeOrders: 0,
            deliveredOrders: 0,
            totalSpent: 0,
            loading: false,
            error: null,
          });
          return;
        }

        // Calculate statistics
        const totalOrders = orders.length;
        const activeOrders = orders.filter((order) =>
          ['pending', 'confirmed', 'processing', 'out_for_delivery'].includes(
            order.status as string
          )
        ).length;
        const deliveredOrders = orders.filter((order) => order.status === 'delivered').length;
        const totalSpent = orders
          .filter((order) => ['delivered', 'paid'].includes(order.status as string))
          .reduce(
            (sum, order) => sum + parseFloat((order.total_amount as number)?.toString() ?? '0'),
            0
          );

        setStats({
          totalOrders,
          activeOrders,
          deliveredOrders,
          totalSpent,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching order stats:', error);
        setStats((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load order statistics',
        }));
      }
    };

    void fetchOrderStats();
  }, [user]);

  return stats;
}
