import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Package, 
  ShoppingCart,
  Star,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Save,
  Loader2
} from 'lucide-react';

interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  order_updates: boolean;
  delivery_notifications: boolean;
  promotional_emails: boolean;
  weekly_deals: boolean;
  product_recommendations: boolean;
  price_alerts: boolean;
  stock_alerts: boolean;
  review_reminders: boolean;
}

interface UserPreferences {
  id: string;
  user_id: string;
  preferred_delivery_window: string | null;
  communication_preferences: NotificationPreferences;
  favorite_categories: string[];
  created_at: string;
  updated_at: string;
}

const defaultPreferences: NotificationPreferences = {
  email_notifications: true,
  sms_notifications: false,
  push_notifications: true,
  order_updates: true,
  delivery_notifications: true,
  promotional_emails: false,
  weekly_deals: false,
  product_recommendations: false,
  price_alerts: false,
  stock_alerts: false,
  review_reminders: true,
};

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no preferences exist, create default ones
        if (error.code === 'PGRST116') {
          const newPreferences = {
            user_id: user.id,
            communication_preferences: defaultPreferences,
            favorite_categories: [],
          };

          const { data: createdData, error: createError } = await supabase
            .from('user_preferences')
            .insert([newPreferences])
            .select()
            .single();

          if (createError) {
            throw createError;
          }

          setPreferences(createdData.communication_preferences || defaultPreferences);
        } else {
          throw error;
        }
      } else {
        setPreferences(data.communication_preferences || defaultPreferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading preferences',
        description: 'Unable to load your notification preferences. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update({
          communication_preferences: preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Preferences saved',
        description: 'Your notification preferences have been updated successfully.',
      });

      setHasChanges(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: 'Unable to save your preferences. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const notificationGroups = [
    {
      title: 'Communication Channels',
      description: 'Choose how you want to receive notifications',
      icon: Bell,
      items: [
        {
          key: 'email_notifications' as keyof NotificationPreferences,
          label: 'Email Notifications',
          description: 'Receive notifications via email',
          icon: Mail,
        },
        {
          key: 'sms_notifications' as keyof NotificationPreferences,
          label: 'SMS Notifications',
          description: 'Receive notifications via text message',
          icon: Smartphone,
        },
        {
          key: 'push_notifications' as keyof NotificationPreferences,
          label: 'Push Notifications',
          description: 'Receive browser push notifications',
          icon: Bell,
        },
      ]
    },
    {
      title: 'Order & Delivery',
      description: 'Stay updated about your orders',
      icon: Package,
      items: [
        {
          key: 'order_updates' as keyof NotificationPreferences,
          label: 'Order Updates',
          description: 'Get notified when your order status changes',
          icon: Package,
        },
        {
          key: 'delivery_notifications' as keyof NotificationPreferences,
          label: 'Delivery Notifications',
          description: 'Receive updates about delivery schedules',
          icon: Package,
        },
        {
          key: 'review_reminders' as keyof NotificationPreferences,
          label: 'Review Reminders',
          description: 'Gentle reminders to review your purchases',
          icon: Star,
        },
      ]
    },
    {
      title: 'Marketing & Promotions',
      description: 'Deals, offers, and product updates',
      icon: DollarSign,
      items: [
        {
          key: 'promotional_emails' as keyof NotificationPreferences,
          label: 'Promotional Emails',
          description: 'Special offers and discount notifications',
          icon: DollarSign,
        },
        {
          key: 'weekly_deals' as keyof NotificationPreferences,
          label: 'Weekly Deals',
          description: 'Weekly roundup of best deals and offers',
          icon: DollarSign,
        },
        {
          key: 'product_recommendations' as keyof NotificationPreferences,
          label: 'Product Recommendations',
          description: 'Personalized product suggestions',
          icon: ShoppingCart,
        },
      ]
    },
    {
      title: 'Product Alerts',
      description: 'Stay informed about products you care about',
      icon: AlertCircle,
      items: [
        {
          key: 'price_alerts' as keyof NotificationPreferences,
          label: 'Price Drop Alerts',
          description: 'Get notified when prices drop on favorited items',
          icon: DollarSign,
        },
        {
          key: 'stock_alerts' as keyof NotificationPreferences,
          label: 'Back in Stock Alerts',
          description: 'Know when out-of-stock items are available again',
          icon: Package,
        },
      ]
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
          <CardDescription>
            Customize how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">Notification Status</div>
                <div className="text-sm text-muted-foreground">
                  All systems operational
                </div>
              </div>
            </div>
            {hasChanges && (
              <Button onClick={savePreferences} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Groups */}
      {notificationGroups.map((group, groupIndex) => (
        <Card key={groupIndex}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <group.icon className="h-5 w-5" />
              <span>{group.title}</span>
            </CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.items.map((item, itemIndex) => (
              <div key={itemIndex}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <Label htmlFor={item.key} className="text-sm font-medium">
                        {item.label}
                      </Label>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <Switch
                    id={item.key}
                    checked={preferences[item.key]}
                    onCheckedChange={(checked) => updatePreference(item.key, checked)}
                  />
                </div>
                {itemIndex < group.items.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Save Button */}
      {hasChanges && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Unsaved Changes</div>
                <div className="text-sm text-muted-foreground">
                  You have unsaved notification preference changes
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    fetchPreferences();
                    setHasChanges(false);
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={savePreferences} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common notification preference presets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => {
                setPreferences({
                  ...defaultPreferences,
                  email_notifications: true,
                  order_updates: true,
                  delivery_notifications: true,
                  promotional_emails: false,
                  weekly_deals: false,
                  product_recommendations: false,
                });
                setHasChanges(true);
              }}
            >
              <Bell className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Essential Only</div>
                <div className="text-xs text-muted-foreground">Order & delivery updates</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => {
                setPreferences({
                  ...defaultPreferences,
                  email_notifications: true,
                  order_updates: true,
                  delivery_notifications: true,
                  promotional_emails: true,
                  weekly_deals: true,
                  product_recommendations: true,
                });
                setHasChanges(true);
              }}
            >
              <DollarSign className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">All Deals</div>
                <div className="text-xs text-muted-foreground">Include promotions & offers</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => {
                setPreferences(Object.keys(defaultPreferences).reduce((acc, key) => ({
                  ...acc,
                  [key]: false
                }), {} as NotificationPreferences));
                setHasChanges(true);
              }}
            >
              <AlertCircle className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Turn Off All</div>
                <div className="text-xs text-muted-foreground">Disable all notifications</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}