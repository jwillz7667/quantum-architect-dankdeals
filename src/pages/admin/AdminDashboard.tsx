import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAdminDashboardMetrics, useAdminLowInventory } from '@/hooks/admin/useAdminDashboard';
import { AlertCircle, CheckCircle2, ShoppingCart, Package, Users, DollarSign } from 'lucide-react';

const AdminDashboard = () => {
  const { data: metrics, isLoading: metricsLoading } = useAdminDashboardMetrics();
  const { data: lowInventory, isLoading: inventoryLoading } = useAdminLowInventory(10);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
        <p className="text-sm text-muted-foreground">
          Monitor catalog health and jump into daily management tasks.
        </p>
        <Separator className="mt-4" />
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Active Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{metrics?.active_products ?? 0}</div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              <Link to="/admin/products" className="hover:underline">
                Manage products →
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Low Inventory */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Inventory
            </CardTitle>
            {!inventoryLoading && (lowInventory?.length ?? 0) > 0 ? (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            {inventoryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold">{lowInventory?.length ?? 0}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(lowInventory?.length ?? 0) > 0 ? (
                    <span className="text-orange-600">Products need restocking</span>
                  ) : (
                    <span className="text-green-600">All inventory levels healthy</span>
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold">{metrics?.pending_orders ?? 0}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {metrics?.today_orders ?? 0} orders today
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Today's Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {formatCurrency(metrics?.today_revenue ?? 0)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  From {metrics?.today_orders ?? 0} paid orders
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Additional Metrics Row */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold">{metrics?.total_users ?? 0}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {metrics?.verified_users ?? 0} age verified
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Storefront Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Storefront Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      metrics?.storefront_status === 'healthy'
                        ? 'default'
                        : metrics?.storefront_status === 'warning'
                          ? 'secondary'
                          : 'destructive'
                    }
                    className="text-base"
                  >
                    {metrics?.storefront_status ?? 'Unknown'}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {metrics?.storefront_status === 'healthy'
                    ? 'All systems operational'
                    : 'Issues detected'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/admin/products/new" className="block text-sm text-primary hover:underline">
              + Add New Product
            </Link>
            <Link to="/admin/products" className="block text-sm text-primary hover:underline">
              → View All Products
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Low Inventory Alert */}
      {!inventoryLoading && (lowInventory?.length ?? 0) > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-orange-900">
              <AlertCircle className="h-5 w-5" />
              Low Inventory Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-orange-900">
              {lowInventory.length} product variant(s) have low inventory (below 10 units).
            </p>
            <div className="space-y-2">
              {lowInventory.slice(0, 5).map((item) => (
                <div
                  key={item.variant_id}
                  className="flex items-center justify-between rounded-md bg-white p-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{item.product_name}</span>
                    <span className="text-muted-foreground"> - {item.variant_name}</span>
                  </div>
                  <Badge variant="secondary">{item.inventory_count ?? 0} left</Badge>
                </div>
              ))}
            </div>
            {lowInventory.length > 5 && (
              <p className="mt-2 text-xs text-orange-700">
                ...and {lowInventory.length - 5} more items
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
