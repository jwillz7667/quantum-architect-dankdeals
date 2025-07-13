import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useToast } from '../../hooks/use-toast';

const Settings: React.FC = () => {
  const { toast } = useToast();
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'DankDeals',
    storeEmail: 'admin@dankdealsmn.com',
    minimumOrderAmount: 100,
    deliveryFee: 10,
    taxRate: 0.08,
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    orderAlerts: true,
    lowStockAlerts: true,
  });

  const handleSaveStoreSettings = () => {
    try {
      // In a real app, save to database
      toast({ title: 'Store settings saved successfully' });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to save settings' });
    }
  };

  const handleSaveNotifications = () => {
    try {
      // In a real app, save to database
      toast({ title: 'Notification settings saved successfully' });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to save settings' });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="store" className="space-y-4">
        <TabsList>
          <TabsTrigger value="store">Store Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle>Store Configuration</CardTitle>
              <CardDescription>
                Manage your store's basic settings and configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={storeSettings.storeName}
                  onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="storeEmail">Store Email</Label>
                <Input
                  id="storeEmail"
                  type="email"
                  value={storeSettings.storeEmail}
                  onChange={(e) => setStoreSettings({ ...storeSettings, storeEmail: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="minimumOrder">Minimum Order Amount ($)</Label>
                <Input
                  id="minimumOrder"
                  type="number"
                  value={storeSettings.minimumOrderAmount}
                  onChange={(e) => setStoreSettings({ ...storeSettings, minimumOrderAmount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deliveryFee">Delivery Fee ($)</Label>
                <Input
                  id="deliveryFee"
                  type="number"
                  value={storeSettings.deliveryFee}
                  onChange={(e) => setStoreSettings({ ...storeSettings, deliveryFee: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  value={storeSettings.taxRate * 100}
                  onChange={(e) => setStoreSettings({ ...storeSettings, taxRate: parseFloat(e.target.value) / 100 || 0 })}
                />
              </div>
              
              <Button onClick={handleSaveStoreSettings}>Save Store Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for important events
                  </p>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Order Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new orders are placed
                  </p>
                </div>
                <Switch
                  checked={notifications.orderAlerts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, orderAlerts: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts when products are running low
                  </p>
                </div>
                <Switch
                  checked={notifications.lowStockAlerts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, lowStockAlerts: checked })}
                />
              </div>
              
              <Button onClick={handleSaveNotifications}>Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage security and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
                <Button variant="outline">Enable 2FA</Button>
              </div>
              
              <div className="space-y-2">
                <Label>Session Management</Label>
                <p className="text-sm text-muted-foreground">
                  View and manage active sessions
                </p>
                <Button variant="outline">View Sessions</Button>
              </div>
              
              <div className="space-y-2">
                <Label>API Keys</Label>
                <p className="text-sm text-muted-foreground">
                  Manage API keys for external integrations
                </p>
                <Button variant="outline">Manage API Keys</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings; 