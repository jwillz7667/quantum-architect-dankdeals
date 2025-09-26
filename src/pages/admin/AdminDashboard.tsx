import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const AdminDashboard = () => {
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">--</span>
            <p className="mt-1 text-xs text-muted-foreground">
              Coming soon: live metrics from Supabase
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">--</span>
            <p className="mt-1 text-xs text-muted-foreground">
              Add alerts by connecting inventory thresholds
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">--</span>
            <p className="mt-1 text-xs text-muted-foreground">Order operations will surface here</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Storefront status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">Healthy</span>
            <p className="mt-1 text-xs text-muted-foreground">No storefront incidents detected</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default AdminDashboard;
