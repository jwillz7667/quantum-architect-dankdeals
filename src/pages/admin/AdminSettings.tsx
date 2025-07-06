import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { 
  Store, 
  MapPin, 
  Clock, 
  CreditCard, 
  Bell, 
  Shield, 
  Save,
  AlertTriangle,
  Check,
  Plus,
  X,
  Mail,
  Phone,
  Globe,
  DollarSign,
  Truck,
  Lock,
  Key,
  UserCheck
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { Json } from '@/integrations/supabase/types';

type StoreSettingsRow = Database['public']['Tables']['store_settings']['Row'];
type DeliveryZoneRow = Database['public']['Tables']['delivery_zones']['Row'];
type NotificationSettingsRow = Database['public']['Tables']['notification_settings']['Row'];
type SecuritySettingsRow = Database['public']['Tables']['security_settings']['Row'];

interface BusinessHours {
  [key: string]: { open: string; close: string; closed: boolean };
}

interface StoreSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  businessHours: BusinessHours;
  timezone: string;
  currency: string;
  orderMinimum: number;
  deliveryFee: number;
  taxRate: number;
  maxDeliveryRadius: number;
}

interface DeliveryZone {
  id: string;
  zipCode: string;
  city: string;
  state: string;
  isActive: boolean;
  deliveryFee: number | null;
}

interface NotificationSettings {
  emailNewOrder: boolean;
  emailOrderCanceled: boolean;
  emailLowInventory: boolean;
  emailNewUser: boolean;
  smsNewOrder: boolean;
  smsOrderCanceled: boolean;
  lowInventoryThreshold: number;
  soundEnabled: boolean;
  desktopNotifications: boolean;
}

interface SecuritySettings {
  twoFactorRequired: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  maxLoginAttempts: number;
  ipWhitelist: string[];
  auditLogRetention: number;
}

const defaultBusinessHours: BusinessHours = {
  monday: { open: '10:00', close: '20:00', closed: false },
  tuesday: { open: '10:00', close: '20:00', closed: false },
  wednesday: { open: '10:00', close: '20:00', closed: false },
  thursday: { open: '10:00', close: '20:00', closed: false },
  friday: { open: '10:00', close: '21:00', closed: false },
  saturday: { open: '10:00', close: '21:00', closed: false },
  sunday: { open: '12:00', close: '18:00', closed: false },
};

export function AdminSettings() {
  const { adminUser } = useAdminAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    storeName: 'DankDeals',
    storeEmail: 'admin@dankdealsmn.com',
    storePhone: '(555) 123-4567',
    storeAddress: '123 Main St, Minneapolis, MN 55401',
    businessHours: defaultBusinessHours,
    timezone: 'America/Chicago',
    currency: 'USD',
    orderMinimum: 50,
    deliveryFee: 5,
    taxRate: 8.775,
    maxDeliveryRadius: 10,
  });

  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([
    { id: '1', zipCode: '55401', city: 'Minneapolis', state: 'MN', isActive: true, deliveryFee: null },
    { id: '2', zipCode: '55402', city: 'Minneapolis', state: 'MN', isActive: true, deliveryFee: null },
    { id: '3', zipCode: '55403', city: 'Minneapolis', state: 'MN', isActive: true, deliveryFee: null },
  ]);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNewOrder: true,
    emailOrderCanceled: true,
    emailLowInventory: true,
    emailNewUser: false,
    smsNewOrder: false,
    smsOrderCanceled: false,
    lowInventoryThreshold: 10,
    soundEnabled: true,
    desktopNotifications: true,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorRequired: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    maxLoginAttempts: 5,
    ipWhitelist: [],
    auditLogRetention: 90,
  });

  const [newZipCode, setNewZipCode] = useState('');
  const [newIpAddress, setNewIpAddress] = useState('');

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load store settings
      const { data: storeData, error: storeError } = await supabase
        .from('store_settings')
        .select('*')
        .single();

      if (storeData && !storeError) {
        const hours = typeof storeData.business_hours === 'object' && storeData.business_hours !== null
          ? (storeData.business_hours as BusinessHours)
          : defaultBusinessHours;

        setStoreSettings({
          storeName: storeData.store_name,
          storeEmail: storeData.store_email,
          storePhone: storeData.store_phone || '',
          storeAddress: storeData.store_address || '',
          businessHours: hours,
          timezone: storeData.timezone,
          currency: storeData.currency,
          orderMinimum: storeData.order_minimum,
          deliveryFee: storeData.delivery_fee,
          taxRate: storeData.tax_rate,
          maxDeliveryRadius: storeData.max_delivery_radius,
        });
      }

      // Load delivery zones
      const { data: zonesData, error: zonesError } = await supabase
        .from('delivery_zones')
        .select('*')
        .order('zip_code');

      if (zonesData && !zonesError) {
        setDeliveryZones(zonesData.map(zone => ({
          id: zone.id,
          zipCode: zone.zip_code,
          city: zone.city,
          state: zone.state,
          isActive: zone.is_active,
          deliveryFee: zone.delivery_fee,
        })));
      }

      // Load notification settings for current admin
      if (adminUser) {
        const { data: notifData, error: notifError } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('admin_id', adminUser.id)
          .single();

        if (notifData && !notifError) {
          setNotificationSettings({
            emailNewOrder: notifData.email_new_order,
            emailOrderCanceled: notifData.email_order_canceled,
            emailLowInventory: notifData.email_low_inventory,
            emailNewUser: notifData.email_new_user,
            smsNewOrder: notifData.sms_new_order,
            smsOrderCanceled: notifData.sms_order_canceled,
            lowInventoryThreshold: notifData.low_inventory_threshold,
            soundEnabled: notifData.sound_enabled,
            desktopNotifications: notifData.desktop_notifications,
          });
        }
      }

      // Load security settings
      const { data: securityData, error: securityError } = await supabase
        .from('security_settings')
        .select('*')
        .single();

      if (securityData && !securityError) {
        setSecuritySettings({
          twoFactorRequired: securityData.two_factor_required,
          sessionTimeout: securityData.session_timeout,
          passwordExpiry: securityData.password_expiry,
          maxLoginAttempts: securityData.max_login_attempts,
          ipWhitelist: securityData.ip_whitelist || [],
          auditLogRetention: securityData.audit_log_retention,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [adminUser, toast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveStoreSettings = async () => {
    setIsSaving(true);
    try {
      // Update store settings
      const { error: storeError } = await supabase
        .from('store_settings')
        .update({
          store_name: storeSettings.storeName,
          store_email: storeSettings.storeEmail,
          store_phone: storeSettings.storePhone,
          store_address: storeSettings.storeAddress,
          business_hours: storeSettings.businessHours as Json,
          timezone: storeSettings.timezone,
          currency: storeSettings.currency,
          order_minimum: storeSettings.orderMinimum,
          delivery_fee: storeSettings.deliveryFee,
          tax_rate: storeSettings.taxRate,
          max_delivery_radius: storeSettings.maxDeliveryRadius,
          updated_at: new Date().toISOString(),
        })
        .eq('id', '00000000-0000-0000-0000-000000000000'); // Default settings ID

      if (storeError) throw storeError;

      // Update notification settings
      if (adminUser) {
        const { error: notifError } = await supabase
          .from('notification_settings')
          .upsert({
            admin_id: adminUser.id,
            email_new_order: notificationSettings.emailNewOrder,
            email_order_canceled: notificationSettings.emailOrderCanceled,
            email_low_inventory: notificationSettings.emailLowInventory,
            email_new_user: notificationSettings.emailNewUser,
            sms_new_order: notificationSettings.smsNewOrder,
            sms_order_canceled: notificationSettings.smsOrderCanceled,
            low_inventory_threshold: notificationSettings.lowInventoryThreshold,
            sound_enabled: notificationSettings.soundEnabled,
            desktop_notifications: notificationSettings.desktopNotifications,
            updated_at: new Date().toISOString(),
          });

        if (notifError) throw notifError;
      }

      // Update security settings  
      const { error: securityError } = await supabase
        .from('security_settings')
        .update({
          two_factor_required: securitySettings.twoFactorRequired,
          session_timeout: securitySettings.sessionTimeout,
          password_expiry: securitySettings.passwordExpiry,
          max_login_attempts: securitySettings.maxLoginAttempts,
          ip_whitelist: securitySettings.ipWhitelist,
          audit_log_retention: securitySettings.auditLogRetention,
          updated_at: new Date().toISOString(),
        })
        .eq('id', '00000000-0000-0000-0000-000000000000'); // Default settings ID

      if (securityError) throw securityError;

      toast({
        title: "Settings Saved",
        description: "All settings have been updated successfully."
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addDeliveryZone = async () => {
    if (!newZipCode) return;
    
    // Check if zone already exists
    if (deliveryZones.some(zone => zone.zipCode === newZipCode)) {
      toast({
        title: "Zone Exists",
        description: `ZIP code ${newZipCode} already exists.`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('delivery_zones')
        .insert({
          zip_code: newZipCode,
          city: 'Minneapolis', // Default to Minneapolis for MN zips
          state: 'MN',
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      const newZone: DeliveryZone = {
        id: data.id,
        zipCode: data.zip_code,
        city: data.city,
        state: data.state,
        isActive: data.is_active,
        deliveryFee: data.delivery_fee,
      };
      
      setDeliveryZones([...deliveryZones, newZone]);
      setNewZipCode('');
      
      toast({
        title: "Zone Added",
        description: `ZIP code ${newZipCode} has been added.`
      });
    } catch (error) {
      console.error('Error adding delivery zone:', error);
      toast({
        title: "Error",
        description: "Failed to add delivery zone.",
        variant: "destructive"
      });
    }
  };

  const removeDeliveryZone = (id: string) => {
    setDeliveryZones(deliveryZones.filter(zone => zone.id !== id));
  };

  const toggleDeliveryZone = (id: string) => {
    setDeliveryZones(deliveryZones.map(zone => 
      zone.id === id ? { ...zone, isActive: !zone.isActive } : zone
    ));
  };

  const addIpToWhitelist = () => {
    if (!newIpAddress) return;
    
    setSecuritySettings({
      ...securitySettings,
      ipWhitelist: [...securitySettings.ipWhitelist, newIpAddress]
    });
    setNewIpAddress('');
  };

  const removeIpFromWhitelist = (ip: string) => {
    setSecuritySettings({
      ...securitySettings,
      ipWhitelist: securitySettings.ipWhitelist.filter(addr => addr !== ip)
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your store configuration and preferences</p>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="store">Store</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>
                Basic information about your store that customers will see
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="store-name">Store Name</Label>
                  <Input
                    id="store-name"
                    value={storeSettings.storeName}
                    onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="store-email">Contact Email</Label>
                  <Input
                    id="store-email"
                    type="email"
                    value={storeSettings.storeEmail}
                    onChange={(e) => setStoreSettings({ ...storeSettings, storeEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="store-phone">Phone Number</Label>
                  <Input
                    id="store-phone"
                    type="tel"
                    value={storeSettings.storePhone}
                    onChange={(e) => setStoreSettings({ ...storeSettings, storePhone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={storeSettings.timezone} 
                    onValueChange={(value) => setStoreSettings({ ...storeSettings, timezone: value })}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="store-address">Store Address</Label>
                <Textarea
                  id="store-address"
                  value={storeSettings.storeAddress}
                  onChange={(e) => setStoreSettings({ ...storeSettings, storeAddress: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>
                Set your store's operating hours for each day of the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(storeSettings.businessHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between">
                    <Label className="w-32 capitalize">{day}</Label>
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={!hours.closed}
                        onCheckedChange={(checked) => {
                          setStoreSettings({
                            ...storeSettings,
                            businessHours: {
                              ...storeSettings.businessHours,
                              [day]: { ...hours, closed: !checked }
                            }
                          });
                        }}
                      />
                      {!hours.closed && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) => {
                              setStoreSettings({
                                ...storeSettings,
                                businessHours: {
                                  ...storeSettings.businessHours,
                                  [day]: { ...hours, open: e.target.value }
                                }
                              });
                            }}
                            className="w-32"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) => {
                              setStoreSettings({
                                ...storeSettings,
                                businessHours: {
                                  ...storeSettings.businessHours,
                                  [day]: { ...hours, close: e.target.value }
                                }
                              });
                            }}
                            className="w-32"
                          />
                        </div>
                      )}
                      {hours.closed && <span className="text-gray-500">Closed</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={saveStoreSettings} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Store Settings'}
          </Button>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Settings</CardTitle>
              <CardDescription>
                Configure delivery zones and fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="delivery-fee">Default Delivery Fee</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="delivery-fee"
                      type="number"
                      value={storeSettings.deliveryFee}
                      onChange={(e) => setStoreSettings({ ...storeSettings, deliveryFee: parseFloat(e.target.value) })}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="max-radius">Maximum Delivery Radius (miles)</Label>
                  <Input
                    id="max-radius"
                    type="number"
                    value={storeSettings.maxDeliveryRadius}
                    onChange={(e) => setStoreSettings({ ...storeSettings, maxDeliveryRadius: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label>Delivery Zones</Label>
                <p className="text-sm text-gray-600 mb-4">
                  Manage ZIP codes where delivery is available
                </p>
                
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Enter ZIP code"
                    value={newZipCode}
                    onChange={(e) => setNewZipCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addDeliveryZone()}
                  />
                  <Button onClick={addDeliveryZone}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Zone
                  </Button>
                </div>

                <div className="space-y-2">
                  {deliveryZones.map((zone) => (
                    <div key={zone.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={zone.isActive}
                          onCheckedChange={() => toggleDeliveryZone(zone.id)}
                        />
                        <div>
                          <p className="font-medium">{zone.zipCode}</p>
                          <p className="text-sm text-gray-600">{zone.city}, {zone.state}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDeliveryZone(zone.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Configure payment options and tax rates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="order-minimum">Minimum Order Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="order-minimum"
                      type="number"
                      value={storeSettings.orderMinimum}
                      onChange={(e) => setStoreSettings({ ...storeSettings, orderMinimum: parseFloat(e.target.value) })}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    step="0.001"
                    value={storeSettings.taxRate}
                    onChange={(e) => setStoreSettings({ ...storeSettings, taxRate: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertDescription>
                  All orders are cash on delivery. No credit card processing is available.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose which events trigger email notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Order</Label>
                    <p className="text-sm text-gray-600">Receive email when a new order is placed</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNewOrder}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, emailNewOrder: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Order Canceled</Label>
                    <p className="text-sm text-gray-600">Receive email when an order is canceled</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailOrderCanceled}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, emailOrderCanceled: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Inventory</Label>
                    <p className="text-sm text-gray-600">Receive email when inventory is low</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailLowInventory}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, emailLowInventory: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New User Registration</Label>
                    <p className="text-sm text-gray-600">Receive email when a new user signs up</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNewUser}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, emailNewUser: checked })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="low-inventory-threshold">Low Inventory Threshold</Label>
                <Input
                  id="low-inventory-threshold"
                  type="number"
                  value={notificationSettings.lowInventoryThreshold}
                  onChange={(e) => 
                    setNotificationSettings({ 
                      ...notificationSettings, 
                      lowInventoryThreshold: parseInt(e.target.value) 
                    })
                  }
                  className="w-32"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Alert when product quantity falls below this number
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security policies and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-600">Require 2FA for all admin accounts</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorRequired}
                    onCheckedChange={(checked) => 
                      setSecuritySettings({ ...securitySettings, twoFactorRequired: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => 
                        setSecuritySettings({ 
                          ...securitySettings, 
                          sessionTimeout: parseInt(e.target.value) 
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="password-expiry">Password Expiry (days)</Label>
                    <Input
                      id="password-expiry"
                      type="number"
                      value={securitySettings.passwordExpiry}
                      onChange={(e) => 
                        setSecuritySettings({ 
                          ...securitySettings, 
                          passwordExpiry: parseInt(e.target.value) 
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                    <Input
                      id="max-login-attempts"
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => 
                        setSecuritySettings({ 
                          ...securitySettings, 
                          maxLoginAttempts: parseInt(e.target.value) 
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="audit-retention">Audit Log Retention (days)</Label>
                    <Input
                      id="audit-retention"
                      type="number"
                      value={securitySettings.auditLogRetention}
                      onChange={(e) => 
                        setSecuritySettings({ 
                          ...securitySettings, 
                          auditLogRetention: parseInt(e.target.value) 
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label>IP Whitelist</Label>
                <p className="text-sm text-gray-600 mb-4">
                  Restrict admin access to specific IP addresses (leave empty to allow all)
                </p>
                
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Enter IP address"
                    value={newIpAddress}
                    onChange={(e) => setNewIpAddress(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addIpToWhitelist()}
                  />
                  <Button onClick={addIpToWhitelist}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add IP
                  </Button>
                </div>

                {securitySettings.ipWhitelist.length > 0 && (
                  <div className="space-y-2">
                    {securitySettings.ipWhitelist.map((ip) => (
                      <div key={ip} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-mono text-sm">{ip}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIpFromWhitelist(ip)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Security settings changes will take effect immediately and may require all users to re-authenticate.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminSettings
