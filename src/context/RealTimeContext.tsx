// src/context/RealTimeContext.tsx
import { createContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { REALTIME_SUBSCRIBE_STATES, type RealtimeChannel, type RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { AuthContextType } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

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
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

// Notification sound configuration
const ENABLE_NOTIFICATION_SOUND = true;
const NOTIFICATION_SOUND_URL = '/notification.mp3';

export function RealTimeProvider({ children }: { children: ReactNode }) {
  const authContext = useAuth() as AuthContextType;
  const user = authContext.user;
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [latestOrderUpdate, setLatestOrderUpdate] = useState<RealtimePostgresChangesPayload<Order> | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<RealTimeContextType['connectionStatus']>('disconnected');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element for notifications
  useEffect(() => {
    if (ENABLE_NOTIFICATION_SOUND && typeof window !== 'undefined') {
      audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
      audioRef.current.volume = 0.3;
    }
  }, []);

  const playNotificationSound = () => {
    if (ENABLE_NOTIFICATION_SOUND && audioRef.current) {
      audioRef.current.play().catch((error: unknown) => {
        logger.warn('Failed to play notification sound', { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      });
    }
  };

  const handleOrderUpdate = (payload: RealtimePostgresChangesPayload<Order>) => {
    try {
      logger.info('Real-time order update received', { 
        eventType: payload.eventType,
        orderId: (payload.new as Order | undefined)?.id || (payload.old as Order | undefined)?.id || 'unknown'
      });
      
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
            playNotificationSound();
          }
        }

        if (newOrder.payment_status !== oldOrder.payment_status && newOrder.payment_status === 'paid') {
          toast({
            title: 'Payment Confirmed',
            description: `Payment for order #${newOrder.order_number} has been confirmed.`,
          });
          playNotificationSound();
        }
      }

      if (payload.eventType === 'INSERT' && payload.new) {
        toast({
          title: 'Order Created',
          description: `Your order #${payload.new.order_number} has been created successfully!`,
        });
        playNotificationSound();
      }
    } catch (error) {
      logger.error('Error handling order update:', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user?.id) return null;

    try {
      setConnectionStatus('connecting');
      
      const ordersChannel = supabase
        .channel(`orders-channel-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`,
          },
          handleOrderUpdate
        )
        .subscribe((status) => {
          logger.info('Real-time subscription status changed', { status });
          
          if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
            setConnectionStatus('connected');
          } else if (status === REALTIME_SUBSCRIBE_STATES.CLOSED) {
            setConnectionStatus('disconnected');
            // Attempt to reconnect after a delay
            reconnectTimeoutRef.current = setTimeout(() => {
              logger.info('Attempting to reconnect real-time subscription');
              const newChannel = setupRealtimeSubscription();
              if (newChannel) {
                setChannel(newChannel);
              }
            }, 5000);
          } else if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR) {
            setConnectionStatus('error');
            logger.error('Real-time channel error');
          }
        });

      return ordersChannel;
    } catch (error) {
      logger.error('Failed to setup real-time subscription:', error instanceof Error ? error : new Error(String(error)));
      setConnectionStatus('error');
      return null;
    }
  };

  useEffect(() => {
    if (!user) {
      // Clean up channel if user logs out
      if (channel) {
        void supabase.removeChannel(channel);
        setChannel(null);
        setConnectionStatus('disconnected');
      }
      return;
    }

    // Setup real-time subscription
    const ordersChannel = setupRealtimeSubscription();
    if (ordersChannel) {
      setChannel(ordersChannel);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ordersChannel) {
        void supabase.removeChannel(ordersChannel);
      }
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const subscribeToOrders = (callback: (payload: RealtimePostgresChangesPayload<Order>) => void) => {
    if (!channel) {
      logger.warn('No real-time channel available for subscription');
      return () => {};
    }

    try {
      // Add custom callback to the existing channel
      const handler = (payload: RealtimePostgresChangesPayload<Order>) => {
        try {
          callback(payload);
        } catch (error) {
          logger.error('Error in order subscription callback:', error instanceof Error ? error : new Error(String(error)));
        }
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
    } catch (error) {
      logger.error('Failed to subscribe to orders:', error instanceof Error ? error : new Error(String(error)));
      return () => {};
    }
  };

  return (
    <RealTimeContext.Provider value={{ subscribeToOrders, latestOrderUpdate, connectionStatus }}>
      {children}
    </RealTimeContext.Provider>
  );
} 