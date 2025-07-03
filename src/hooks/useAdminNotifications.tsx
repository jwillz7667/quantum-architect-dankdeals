import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export interface AdminNotification {
  id: string;
  type: 'order' | 'inventory' | 'user' | 'system' | 'payment';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  metadata?: {
    orderId?: string;
    productId?: string;
    userId?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    actionUrl?: string;
  };
}

interface NotificationPreferences {
  emailNewOrder: boolean;
  emailOrderCanceled: boolean;
  emailLowInventory: boolean;
  emailNewUser: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
}

export function useAdminNotifications() {
  const { adminUser } = useAdminAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNewOrder: true,
    emailOrderCanceled: true,
    emailLowInventory: true,
    emailNewUser: false,
    soundEnabled: true,
    desktopNotifications: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load notifications from database
  const loadNotifications = useCallback(async () => {
    if (!adminUser) return;

    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('admin_id', adminUser.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data?.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.is_read,
        createdAt: new Date(n.created_at),
        metadata: n.metadata,
      })) || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [adminUser]);

  // Load notification preferences
  const loadPreferences = useCallback(async () => {
    if (!adminUser) return;

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('admin_id', adminUser.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore not found error

      if (data) {
        setPreferences({
          emailNewOrder: data.email_new_order,
          emailOrderCanceled: data.email_order_canceled,
          emailLowInventory: data.email_low_inventory,
          emailNewUser: data.email_new_user,
          soundEnabled: data.sound_enabled ?? true,
          desktopNotifications: data.desktop_notifications ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }, [adminUser]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!adminUser) return;

    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('admin_id', adminUser.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.filter(n => n.id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Update notification preferences
  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!adminUser) return;

    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);

    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          admin_id: adminUser.id,
          email_new_order: updatedPreferences.emailNewOrder,
          email_order_canceled: updatedPreferences.emailOrderCanceled,
          email_low_inventory: updatedPreferences.emailLowInventory,
          email_new_user: updatedPreferences.emailNewUser,
          sound_enabled: updatedPreferences.soundEnabled,
          desktop_notifications: updatedPreferences.desktopNotifications,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
    }
  };

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (preferences.soundEnabled) {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    }
  }, [preferences.soundEnabled]);

  // Show desktop notification
  const showDesktopNotification = useCallback((notification: AdminNotification) => {
    if (!preferences.desktopNotifications) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon-96x96.png',
        tag: notification.id,
      });
    }
  }, [preferences.desktopNotifications]);

  // Request desktop notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!adminUser) return;

    const channel = supabase
      .channel(`admin-notifications:${adminUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
          filter: `admin_id=eq.${adminUser.id}`,
        },
        (payload) => {
          const newNotification: AdminNotification = {
            id: payload.new.id,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            isRead: false,
            createdAt: new Date(payload.new.created_at),
            metadata: payload.new.metadata,
          };

          setNotifications(prev => [newNotification, ...prev]);
          playNotificationSound();
          showDesktopNotification(newNotification);

          // Show toast for high priority notifications
          if (newNotification.metadata?.severity === 'high' || 
              newNotification.metadata?.severity === 'critical') {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: newNotification.metadata?.severity === 'critical' ? 'destructive' : 'default',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminUser, playNotificationSound, showDesktopNotification, toast]);

  // Load initial data
  useEffect(() => {
    loadNotifications();
    loadPreferences();
  }, [loadNotifications, loadPreferences]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    preferences,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    requestNotificationPermission,
    refreshNotifications: loadNotifications,
  };
} 