/**
 * User Settings Page
 *
 * Comprehensive settings panel with tabs for:
 * - Profile information (name, phone, email)
 * - Address book (delivery addresses)
 * - Order history
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import { SEOHead } from '@/components/SEOHead';
import { ArrowLeft } from '@/lib/icons';
import ProfileSettings from '@/components/settings/ProfileSettings';
import AddressSettings from '@/components/settings/AddressSettings';
import OrderHistory from '@/components/settings/OrderHistory';

export default function UserSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <>
      <SEOHead
        title="Account Settings - DankDeals MN"
        description="Manage your account, addresses, and view order history"
        url="https://dankdealsmn.com/settings"
      />

      <div className="min-h-screen bg-background pb-32 md:pb-0">
        <DesktopHeader />
        <MobileHeader title="Settings" />

        <div className="max-w-4xl mx-auto px-4 pt-8 pb-28 md:pb-12">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate('/profile')} className="mb-6 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Account
          </Button>

          {/* Settings Tabs */}
          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="addresses">Addresses</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <ProfileSettings />
              </TabsContent>

              <TabsContent value="addresses" className="space-y-4">
                <AddressSettings />
              </TabsContent>

              <TabsContent value="orders" className="space-y-4">
                <OrderHistory />
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <BottomNav />
      </div>
    </>
  );
}
