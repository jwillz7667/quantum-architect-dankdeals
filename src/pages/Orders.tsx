import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { MobileHeader } from '@/components/MobileHeader';
import { DesktopHeader } from '@/components/DesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import { SEOHead } from '@/components/SEOHead';
import { Package, ArrowLeft } from '@/lib/icons';

export default function Orders() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Order History - DankDeals MN"
        description="View your order history and track deliveries"
        url="https://dankdealsmn.com/orders"
      />

      <div className="min-h-screen bg-background pb-32 md:pb-0">
        <DesktopHeader />
        <MobileHeader title="Order History" />

        <div className="max-w-2xl mx-auto px-4 pt-8 pb-24">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate('/profile')} className="mb-6 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Account
          </Button>

          {/* Empty State */}
          <Card className="p-12">
            <div className="text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-secondary mx-auto flex items-center justify-center">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">No orders yet</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                When you place your first order, it will appear here.
              </p>
              <Button onClick={() => navigate('/')} className="btn-primary">
                Start Shopping
              </Button>
            </div>
          </Card>
        </div>

        <BottomNav />
      </div>
    </>
  );
}
