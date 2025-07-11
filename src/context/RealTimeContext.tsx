// src/context/RealTimeContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  subtotal?: number;
  tax_amount?: number;
  delivery_fee?: number;
  delivery_first_name?: string;
  delivery_last_name?: string;
  delivery_street_address?: string;
  delivery_apartment?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_zip_code?: string;
  delivery_phone?: string;
  delivery_instructions?: string;
  payment_method?: string;
  delivery_date?: string;
  delivery_time_start?: string;
  delivery_time_end?: string;
  estimated_delivery_at?: string;
  delivered_at?: string;
  notes?: string;
}

interface RealTimeContextType {
  subscribeToOrders: (callback: (payload: RealtimePostgresChangesPayload<Order>) => void) => () => void;
  latestOrderUpdate: RealtimePostgresChangesPayload<Order> | null;
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

export function RealTimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [latestOrderUpdate, setLatestOrderUpdate] = useState<RealtimePostgresChangesPayload<Order> | null>(null);

  useEffect(() => {
    if (!user) {
      // Clean up channel if user logs out
      if (channel) {
        void supabase.removeChannel(channel);
        setChannel(null);
      }
      return;
    }

    // Create channel for real-time updates
    const ordersChannel = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Order>) => {
          console.log('Real-time order update:', payload);
          setLatestOrderUpdate(payload);

          // Show toast notifications for order status changes
          if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
            const newOrder = payload.new;
            const oldOrder = payload.old;

            if (newOrder.status !== oldOrder.status) {
              const statusMessages = {
                confirmed: `Order #${newOrder.order_number} has been confirmed!`,
                processing: `Order #${newOrder.order_number} is being processed.`,
                out_for_delivery: `Order #${newOrder.order_number} is out for delivery!`,
                delivered: `Order #${newOrder.order_number} has been delivered. Enjoy!`,
                cancelled: `Order #${newOrder.order_number} has been cancelled.`,
              };

              const message = statusMessages[newOrder.status as keyof typeof statusMessages];
              if (message) {
                toast({
                  title: 'Order Update',
                  description: message,
                  variant: newOrder.status === 'cancelled' ? 'destructive' : 'default',
                });
              }
            }

            if (newOrder.payment_status !== oldOrder.payment_status && newOrder.payment_status === 'paid') {
              toast({
                title: 'Payment Confirmed',
                description: `Payment for order #${newOrder.order_number} has been confirmed.`,
              });
            }
          }

          if (payload.eventType === 'INSERT' && payload.new) {
            toast({
              title: 'Order Created',
              description: `Your order #${payload.new.order_number} has been created successfully!`,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    setChannel(ordersChannel);

    return () => {
      if (ordersChannel) {
        void supabase.removeChannel(ordersChannel);
      }
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const subscribeToOrders = (callback: (payload: RealtimePostgresChangesPayload<Order>) => void) => {
    if (!channel) {
      console.warn('No real-time channel available');
      return () => {};
    }

    // Add custom callback to the existing channel
    const handler = (payload: RealtimePostgresChangesPayload<Order>) => {
      callback(payload);
    };

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: user ? `user_id=eq.${user.id}` : undefined,
      },
      handler
    );

    // Return cleanup function
    return () => {
      // Note: We don't remove the entire channel here, just the specific handler
      // The channel is managed by the provider lifecycle
    };
  };

  return (
    <RealTimeContext.Provider value={{ subscribeToOrders, latestOrderUpdate }}>
      {children}
    </RealTimeContext.Provider>
  );
}

export function useRealTime() {
  const context = useContext(RealTimeContext);
  if (context === undefined) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
} 