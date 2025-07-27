import { useState, useEffect, useCallback } from 'react';
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
  DollarSign,
  AlertCircle,
  CheckCircle,
  Save,
  Loader2,
} from '@/lib/icons';

interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
}

interface DatabasePreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  dark_mode: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface SupabaseError {
  code: string;
  message: string;
}

interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}

const defaultPreferences: NotificationPreferences = {
  email_notifications: true,
  sms_notifications: false,
  push_notifications: true,
  marketing_emails: false,
};

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPreferences = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = (await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()) as SupabaseResponse<DatabasePreferences>;

      const { data, error } = response;

      if (error) {
        // If no preferences exist, create default ones
        if (error.code === 'PGRST116') {
          const newPreferences = {
            user_id: user.id,
            ...defaultPreferences,
            dark_mode: false,
            two_factor_enabled: false,
          };

          const createResponse = (await supabase
            .from('user_preferences')
            .insert([newPreferences])
            .select()
            .single()) as SupabaseResponse<DatabasePreferences>;

          const { data: createdData, error: createError } = createResponse;

          if (createError) {
            throw new Error(createError.message || 'Failed to create preferences');
          }

          if (!createdData) {
            throw new Error('Failed to create preferences');
          }
          const typedData = createdData;
          setPreferences({
            email_notifications: typedData.email_notifications,
            sms_notifications: typedData.sms_notifications,
            push_notifications: typedData.push_notifications,
            marketing_emails: typedData.marketing_emails,
          });
        } else {
          throw new Error(error.message || 'Unknown error occurred');
        }
      } else {
        if (!data) {
          throw new Error('No preferences data found');
        }
        const typedData = data;
        setPreferences({
          email_notifications: typedData.email_notifications,
          sms_notifications: typedData.sms_notifications,
          push_notifications: typedData.push_notifications,
          marketing_emails: typedData.marketing_emails,
        });
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
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      void fetchPreferences();
    }
  }, [user, fetchPreferences]);

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
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
          email_notifications: preferences.email_notifications,
          sms_notifications: preferences.sms_notifications,
          push_notifications: preferences.push_notifications,
          marketing_emails: preferences.marketing_emails,
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
      ],
    },
    {
      title: 'Marketing & Promotions',
      description: 'Deals, offers, and promotional content',
      icon: DollarSign,
      items: [
        {
          key: 'marketing_emails' as keyof NotificationPreferences,
          label: 'Marketing Emails',
          description: 'Special offers, deals, and promotional notifications',
          icon: DollarSign,
        },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
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
          <CardDescription>Customize how and when you receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">Notification Status</div>
                <div className="text-sm text-muted-foreground">All systems operational</div>
              </div>
            </div>
            {hasChanges && (
              <Button onClick={() => void savePreferences()} disabled={saving}>
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
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </div>
                  <Switch
                    id={item.key}
                    checked={preferences[item.key]}
                    onCheckedChange={(checked) => updatePreference(item.key, checked)}
                  />
                </div>
                {itemIndex < group.items.length - 1 && <Separator className="mt-4" />}
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
                    void fetchPreferences();
                    setHasChanges(false);
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={() => void savePreferences()} disabled={saving}>
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
          <CardDescription>Common notification preference presets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => {
                setPreferences({
                  email_notifications: true,
                  sms_notifications: false,
                  push_notifications: true,
                  marketing_emails: false,
                });
                setHasChanges(true);
              }}
            >
              <Bell className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Essential Only</div>
                <div className="text-xs text-muted-foreground">Email & push notifications only</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => {
                setPreferences({
                  email_notifications: true,
                  sms_notifications: true,
                  push_notifications: true,
                  marketing_emails: true,
                });
                setHasChanges(true);
              }}
            >
              <DollarSign className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">All Notifications</div>
                <div className="text-xs text-muted-foreground">Enable all notification types</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => {
                setPreferences({
                  email_notifications: false,
                  sms_notifications: false,
                  push_notifications: false,
                  marketing_emails: false,
                });
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
